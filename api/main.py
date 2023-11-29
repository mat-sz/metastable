import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), ".pip"))

import comfy.options
comfy.options.enable_args_parsing()

import importlib.util
import folder_paths
import time

# Main code
import asyncio
import itertools
import shutil
import threading
import gc

from comfy.cli_args import args

if os.name == "nt":
    import logging
    logging.getLogger("xformers").addFilter(lambda record: 'A matching Triton is not available' not in record.getMessage())

if __name__ == "__main__":
    if args.cuda_device is not None:
        os.environ['CUDA_VISIBLE_DEVICES'] = str(args.cuda_device)
        print("Set cuda device to:", args.cuda_device)

    import cuda_malloc

import comfy.utils
import yaml

import execution
import downloader
import watcher
import server
from server import BinaryEventTypes
import comfy.model_management


def cuda_malloc_warning():
    device = comfy.model_management.get_torch_device()
    device_name = comfy.model_management.get_torch_device_name(device)
    cuda_malloc_warning = False
    if "cudaMallocAsync" in device_name:
        for b in cuda_malloc.blacklist:
            if b in device_name:
                cuda_malloc_warning = True
        if cuda_malloc_warning:
            print("\nWARNING: this card most likely does not support cuda-malloc, if you get \"CUDA error\" please run ComfyUI with: --disable-cuda-malloc\n")

def prompt_worker(q, server):
    e = execution.PromptExecutor(server)
    while True:
        item, item_id = q.get()
        execution_start_time = time.perf_counter()
        prompt_id = item[0]
        e.execute(item[1], prompt_id)
        q.task_done(item_id, e.outputs_ui)
        if server.client_id is not None:
            server.send_sync("prompt.progress", { "value": 0, "max": 0 }, server.client_id)

        print("Prompt executed in {:.2f} seconds".format(time.perf_counter() - execution_start_time))
        gc.collect()
        comfy.model_management.soft_empty_cache()

def download_worker(q, server):
    e = downloader.Downloader(server)
    while True:
        item, item_id = q.get()
        execution_start_time = time.perf_counter()
        download_id = item[0]
        e.execute(item[1], download_id)
        q.task_done(item_id)

        print("Download executed in {:.2f} seconds".format(time.perf_counter() - execution_start_time))
        gc.collect()

def watcher_worker(w):
    w.run()


async def run(server, address='', port=5000, verbose=True):
    await asyncio.gather(server.start(address, port, verbose), server.publish_loop())


def hijack_progress(server):
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        server.send_sync("prompt.progress", { "value": value, "max": total }, server.client_id)
        if preview_image is not None:
            server.send_sync(BinaryEventTypes.UNENCODED_PREVIEW_IMAGE, preview_image, server.client_id)
    comfy.utils.set_progress_bar_global_hook(hook)

def cleanup_temp():
    temp_dir = folder_paths.get_temp_directory()
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    cleanup_temp()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = server.PromptServer(loop)
    prompt_queue = execution.PromptQueue(server)
    download_queue = downloader.DownloadQueue(server)
    w = watcher.Watcher(server);

    cuda_malloc_warning()

    server.add_routes()
    hijack_progress(server)

    threading.Thread(target=prompt_worker, daemon=True, args=(prompt_queue, server,)).start()
    threading.Thread(target=download_worker, daemon=True, args=(download_queue, server,)).start()
    threading.Thread(target=watcher_worker, daemon=True, args=(w,)).start()

    try:
        loop.run_until_complete(run(server, address=args.listen, verbose=not args.dont_print_server))
    except KeyboardInterrupt:
        print("\nStopped server")

    cleanup_temp()
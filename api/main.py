import comfy.options
comfy.options.enable_args_parsing()

import os
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
        prompt_id = item[1]
        e.execute(item[2], prompt_id)
        q.task_done(item_id, e.outputs_ui)
        if server.client_id is not None:
            server.send_sync("executing", { "node": None, "prompt_id": prompt_id }, server.client_id)

        print("Prompt executed in {:.2f} seconds".format(time.perf_counter() - execution_start_time))
        gc.collect()
        comfy.model_management.soft_empty_cache()


async def run(server, address='', port=8188, verbose=True):
    await asyncio.gather(server.start(address, port, verbose), server.publish_loop())


def hijack_progress(server):
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        server.send_sync("progress", {"value": value, "max": total}, server.client_id)
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
    q = execution.PromptQueue(server)

    cuda_malloc_warning()

    server.add_routes()
    hijack_progress(server)

    threading.Thread(target=prompt_worker, daemon=True, args=(q, server,)).start()

    try:
        loop.run_until_complete(run(server, address=args.listen, port=args.port, verbose=not args.dont_print_server))
    except KeyboardInterrupt:
        print("\nStopped server")

    cleanup_temp()
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), ".pip"))

import comfy.options
comfy.options.enable_args_parsing()

import importlib.util
import time

# Main code
import asyncio
import itertools
import shutil
import threading
import gc
import json

import comfy.samplers
from helpers import jsonout, get_torch_info
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
            print("WARNING: this card most likely does not support cuda-malloc, if you get \"CUDA error\" please run ComfyUI with: --disable-cuda-malloc")

def prompt_worker(q):
    e = execution.PromptExecutor()
    while True:
        item, item_id = q.get()
        e.execute(item)
        q.task_done(item_id, e.outputs_ui)
        gc.collect()
        comfy.model_management.soft_empty_cache()

async def run(prompt_queue):
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader(limit=50*1024*1024)
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)
    w_transport, w_protocol = await loop.connect_write_pipe(asyncio.streams.FlowControlMixin, sys.stdout)
    writer = asyncio.StreamWriter(w_transport, w_protocol, reader, loop)
    
    while True:
        res = await reader.readline()
        if not res:
            break
        
        try:
            ev = json.loads(res)
            if ev["event"] == "prompt":
                prompt_queue.put(ev["data"])
        except:
            pass

        await writer.drain()

def hijack_progress():
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        jsonout("prompt.progress", { "value": value, "max": total })
        # if preview_image is not None:
        #    server.send_sync(BinaryEventTypes.UNENCODED_PREVIEW_IMAGE, preview_image, server.client_id)
    comfy.utils.set_progress_bar_global_hook(hook)

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    prompt_queue = execution.PromptQueue()

    cuda_malloc_warning()

    hijack_progress()

    threading.Thread(target=prompt_worker, daemon=True, args=(prompt_queue,)).start()

    jsonout("info.torch", get_torch_info())
    jsonout("info.samplers", comfy.samplers.KSampler.SAMPLERS)
    jsonout("info.schedulers", comfy.samplers.KSampler.SCHEDULERS)

    try:
        jsonout("ready")
        loop.run_until_complete(run(prompt_queue))
    except KeyboardInterrupt:
        print("Stopped server")
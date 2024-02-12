import sys
import os

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
import custom
from helpers import jsonout, get_torch_info
from comfy.cli_args import args

import progress_hook

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
    
    while True:
        res = await loop.run_in_executor(None, sys.stdin.readline)

        if not res:
            break
        
        try:
            ev = json.loads(res)
            if ev["event"] == "prompt":
                prompt_queue.put(ev["data"])
        except:
            pass

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    prompt_queue = execution.PromptQueue()

    cuda_malloc_warning()

    progress_hook.reset()

    threading.Thread(target=prompt_worker, daemon=True, args=(prompt_queue,)).start()

    jsonout("info.torch", get_torch_info())
    jsonout("info.samplers", comfy.samplers.KSampler.SAMPLERS)
    jsonout("info.schedulers", comfy.samplers.KSampler.SCHEDULERS + list(custom.get_custom_schedulers().keys()))

    try:
        jsonout("ready")
        loop.run_until_complete(run(prompt_queue))
    except KeyboardInterrupt:
        print("Stopped server")
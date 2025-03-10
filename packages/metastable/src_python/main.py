import output
output.configure(3)

import sys
import os
import comfy_patch
args = comfy_patch.get_args()

use_zluda = args.zluda_path and args.hip_path and args.hip_version
if use_zluda:
    from zluda import enable_zluda
    enable_zluda()

if __name__ == "__main__":
    os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
    if args.cuda_device is not None:
        os.environ['CUDA_VISIBLE_DEVICES'] = str(args.cuda_device)
        print("Set cuda device to:", args.cuda_device)

import cuda_malloc

import torch
if not torch.cuda.is_available() and not args.directml and not torch.backends.mps.is_available():
    args.cpu = True

# Main code
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

import comfy.samplers
from rpc import RPC
import importlib.util

if os.name == "nt":
    import logging
    logging.getLogger("xformers").addFilter(lambda record: 'A matching Triton is not available' not in record.getMessage())

import comfy.utils

import comfy.model_management

torch_device_name = comfy.model_management.get_torch_device_name(comfy.model_management.get_torch_device())

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

def handle(rpc, request):
    try:
        response = rpc.handle(request)
        output.write_json(response)
    except:
        pass

async def run(rpc):
    loop = asyncio.get_event_loop()
    executor = ThreadPoolExecutor(4)

    while True:
        request_str = await loop.run_in_executor(None, sys.stdin.readline)

        if not request_str:
            break

        try:
            executor.submit(handle, rpc, json.loads(request_str))
        except:
            pass

if __name__ == "__main__":
    print("Starting ComfyUI server")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    rpc = RPC()

    namespaces = ['base']
    if args.namespace:
        namespaces.extend(args.namespace)

    namespaces_dir = os.path.join(os.path.dirname(__file__), 'namespaces')
    for namespace in namespaces:
        name = f'namespaces.{namespace}'
        spec = importlib.util.spec_from_file_location(name, os.path.join(namespaces_dir, namespace, '__init__.py'))
        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)
        mod.insert_all(rpc)

    cuda_malloc_warning()

    try:
        print("Ready!")
        output.write_event("ready")
        loop.run_until_complete(run(rpc))
    except KeyboardInterrupt:
        print("Stopped server")

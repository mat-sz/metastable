from typing import NotRequired, TypedDict
import psutil
import torch

from comfy.model_management import get_torch_device, get_total_memory, vae_dtype, is_intel_xpu, loaded_models
import comfy.samplers
from .utils import custom

from rpc import RPC
import rpc_types
from model_cache import cache

class TorchDeviceInfo(TypedDict):
    type: str
    index: NotRequired[int]
    name: str
    allocator_backend: NotRequired[str]

def get_torch_device_info(device) -> TorchDeviceInfo:
    if hasattr(device, 'type'):
        if device.type == "cuda":
            try:
                allocator_backend = torch.cuda.get_allocator_backend()
            except:
                allocator_backend = ""
            return {
                "type": device.type,
                "index": device.index,
                "allocator_backend": allocator_backend,
                "name": torch.cuda.get_device_name(device)
            }
        else:
            return {
                "type": device.type,
            }
    elif is_intel_xpu():
        return {
            "type": str(device),
            "name": torch.xpu.get_device_name(device)
        }
    else:
        return {
            "type": "cuda",
            "index": device,
            "name": torch.cuda.get_device_name(device)
        }

class TorchVaeInfo(TypedDict):
    dtype: str

class TorchMemoryInfo(TypedDict):
    vram: int
    ram: int

class TorchInfo(TypedDict):
    memory: TorchMemoryInfo
    device: TorchDeviceInfo
    vae: TorchVaeInfo

def get_torch_info() -> TorchInfo:
    device = get_torch_device()

    return {
        "memory": {
            "vram": get_total_memory(device),
            "ram": psutil.virtual_memory().total
        },
        "device": get_torch_device_info(device),
        "vae": {
            "dtype": str(vae_dtype())
        }
    }


class InstanceInfo(TypedDict):
    torch: TorchInfo
    samplers: list[str]
    schedulers: list[str]

class InstanceNamespace:
    @RPC.method
    def info() -> InstanceInfo:
        return {
            "torch": get_torch_info(),
            "samplers": comfy.samplers.KSampler.SAMPLERS,
            "schedulers": comfy.samplers.KSampler.SCHEDULERS + list(custom.get_custom_schedulers().keys())
        }
    
    @RPC.method
    def cleanup_models(except_for: list[rpc_types.CachedModelInfo] = []) -> None:
        if len(except_for) > 0:
            cache().remove_all_except_for(except_for)
        else:
            cache().clear()
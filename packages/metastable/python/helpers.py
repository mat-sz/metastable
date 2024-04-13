import psutil
import torch
from comfy.model_management import get_torch_device, get_total_memory, vae_dtype, is_intel_xpu

def get_torch_device_info(device):
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

def get_torch_info():
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
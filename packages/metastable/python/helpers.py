import json
import os
import psutil
import torch
import sys
from comfy.model_management import get_torch_device, get_total_memory, vae_dtype

out = os.fdopen(3, 'bw')

def out_write(data):
    global out
    out.write(data.encode('utf-8'))
    out.write(b'\x1e')
    out.flush()

def jsonout(event_name, data=None):
    out_write(json.dumps({ "type": "event", "event": event_name, "data": data }))

def get_save_image_counter(output_dir):
    def map_filename(filename):
        try:
            digits = int(filename.split('.')[0].split('_')[0])
        except:
            digits = 0
        return digits

    try:
        counter = max(map(map_filename, os.listdir(output_dir))) + 1
    except ValueError:
        counter = 1
    except FileNotFoundError:
        os.makedirs(output_dir, exist_ok=True)
        counter = 1
    return counter

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
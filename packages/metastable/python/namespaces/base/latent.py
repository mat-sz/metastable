import torch
import comfy.model_management

from rpc import RPC

class LatentNamespace:
    @RPC.autoref
    @RPC.method("empty")
    def empty(width, height, batch_size=1, latent_type="default"):
        if latent_type == "sd3":
            device = comfy.model_management.intermediate_device()
            return {"samples":torch.ones([batch_size, 16, height // 8, width // 8], device=device) * 0.0609}
        else:
            return {"samples":torch.zeros([batch_size, 4, height // 8, width // 8])}
import torch

import comfy.utils
import comfy.model_management
from comfy_extras.chainner_models import model_loading

from rpc import RPC

class UpscaleModelNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        sd = comfy.utils.load_torch_file(path, safe_load=True)
        if "module.layers.0.residual_group.blocks.0.norm1.weight" in sd:
            sd = comfy.utils.state_dict_prefix_replace(sd, {"module.":""})
        return model_loading.load_state_dict(sd).eval()

    @RPC.autoref
    @RPC.method("apply")
    def apply(upscale_model, images):
        device = comfy.model_management.get_torch_device()
        upscale_model.to(device)
        images = torch.stack(images)
        in_img = images.movedim(-1,-3).to(device)

        tile = 512
        overlap = 32

        oom = True
        while oom:
            try:
                steps = in_img.shape[0] * comfy.utils.get_tiled_scale_steps(in_img.shape[3], in_img.shape[2], tile_x=tile, tile_y=tile, overlap=overlap)
                pbar = comfy.utils.ProgressBar(steps)
                s = comfy.utils.tiled_scale(in_img, lambda a: upscale_model(a), tile_x=tile, tile_y=tile, overlap=overlap, upscale_amount=upscale_model.scale, pbar=pbar)
                oom = False
            except comfy.model_management.OOM_EXCEPTION as e:
                tile //= 2
                if tile < 128:
                    raise e

        upscale_model.cpu()
        s = torch.clamp(s.movedim(-3,-1), min=0, max=1.0)
        return [value for value in s]
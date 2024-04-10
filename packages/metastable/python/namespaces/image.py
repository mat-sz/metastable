from PIL import Image, ImageOps
import numpy as np
import torch
from io import BytesIO

import comfy.utils
import comfy.model_management
from comfy_extras.chainner_models import model_loading

from rpc import RPC

def load_upscale_model(settings):
    model_path = settings["path"]
    sd = comfy.utils.load_torch_file(model_path, safe_load=True)
    if "module.layers.0.residual_group.blocks.0.norm1.weight" in sd:
        sd = comfy.utils.state_dict_prefix_replace(sd, {"module.":""})
    return model_loading.load_state_dict(sd).eval()

def image_upscale(upscale_model, image):
    device = comfy.model_management.get_torch_device()
    upscale_model.to(device)
    in_img = image.movedim(-1,-3).to(device)
    free_memory = comfy.model_management.get_free_memory(device)

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
    return s

class ImageNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(data):
        i = Image.open(data)
        i = ImageOps.exif_transpose(i)
        image = i.convert("RGB")
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]

        if 'A' in i.getbands():
            mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
            mask = 1. - torch.from_numpy(mask)
        else:
            mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
        
        return {
            "image": image,
            "mask": mask.unsqueeze(0)
        }

    @RPC.autoref
    @RPC.method("dump")
    def dump(image, format="PNG"):
        i = 255. * image.cpu().detach().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        buf = BytesIO()
        img.save(buf, format=format, compress_level=4)
        return buf

    @RPC.autoref
    @RPC.method("latent.empty")
    def empty(width, height, batch_size=1):
        return {"samples":torch.zeros([batch_size, 4, height // 8, width // 8])}

    @RPC.autoref
    @RPC.method("upscale")
    def upscale(images, model_path):
        upscale_model = load_upscale_model(model_path)
        return image_upscale(upscale_model, images)
  
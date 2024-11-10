import torch
import math

import comfy.sd
import comfy.utils

from rpc import RPC

def vae_decode_circular(vae, samples):
    for layer in [
        layer
        for layer in vae.first_stage_model.modules()
        if isinstance(layer, torch.nn.Conv2d)
    ]:
        layer.padding_mode = "circular"
    result = vae.decode(samples)
    for layer in [
        layer
        for layer in vae.first_stage_model.modules()
        if isinstance(layer, torch.nn.Conv2d)
    ]:
        layer.padding_mode = "zeros"
    return result

def vae_encode_crop_pixels(pixels):
    x = (pixels.shape[1] // 8) * 8
    y = (pixels.shape[2] // 8) * 8
    if pixels.shape[1] != x or pixels.shape[2] != y:
        x_offset = (pixels.shape[1] % 8) // 2
        y_offset = (pixels.shape[2] % 8) // 2
        pixels = pixels[:, x_offset:x + x_offset, y_offset:y + y_offset, :]
    return pixels

def vae_encode(vae, pixels):
    pixels = vae_encode_crop_pixels(pixels)
    t = vae.encode(pixels[:,:,:,:3])
    return {"samples":t}

def vae_encode_inpaint(vae, pixels, mask, grow_mask_by=6):
    x = (pixels.shape[1] // 8) * 8
    y = (pixels.shape[2] // 8) * 8
    mask = torch.nn.functional.interpolate(mask.reshape((-1, 1, mask.shape[-2], mask.shape[-1])), size=(pixels.shape[1], pixels.shape[2]), mode="bilinear")

    pixels = pixels.clone()
    if pixels.shape[1] != x or pixels.shape[2] != y:
        x_offset = (pixels.shape[1] % 8) // 2
        y_offset = (pixels.shape[2] % 8) // 2
        pixels = pixels[:,x_offset:x + x_offset, y_offset:y + y_offset,:]
        mask = mask[:,:,x_offset:x + x_offset, y_offset:y + y_offset]

    #grow mask by a few pixels to keep things seamless in latent space
    if grow_mask_by == 0:
        mask_erosion = mask
    else:
        kernel_tensor = torch.ones((1, 1, grow_mask_by, grow_mask_by))
        padding = math.ceil((grow_mask_by - 1) / 2)

        mask_erosion = torch.clamp(torch.nn.functional.conv2d(mask.round(), kernel_tensor, padding=padding), 0, 1)

    m = (1.0 - mask.round()).squeeze(1)
    for i in range(3):
        pixels[:,:,:,i] -= 0.5
        pixels[:,:,:,i] *= m
        pixels[:,:,:,i] += 0.5
    t = vae.encode(pixels)

    return {"samples":t, "noise_mask": (mask_erosion[:,:,:x,:y].round())}

class VAENamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        sd = comfy.utils.load_torch_file(path)
        return comfy.sd.VAE(sd=sd)
    
    @RPC.autoref
    @RPC.method("decode")
    def decode(vae, samples, is_circular=False):
        decoded = None
        if is_circular:
            decoded = vae_decode_circular(vae, samples)
        else:
            decoded = vae.decode(samples)
        
        if len(decoded.shape) == 5: #Combine batches
            decoded = decoded.reshape(-1, decoded.shape[-3], decoded.shape[-2], decoded.shape[-1])
        
        # So we can iterate over this.
        return [value for value in decoded]

    @RPC.autoref
    @RPC.method("encode")
    def encode(vae, image, mask=None):
        # TODO: Refactor when types are added.
        image = image.unsqueeze(0)
        mask = mask.unsqueeze(0)

        if mask is not None:
            return vae_encode_inpaint(vae, image, mask)

        return vae_encode(vae, image)
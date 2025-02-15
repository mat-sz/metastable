import torch
import math

import comfy.sd
import comfy.utils
import rpc_types

from rpc import RPC
from model_cache import cache

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

def load_vae(path: str):
    info = {
        "path": path,
    }

    def load():
        sd = comfy.utils.load_torch_file(path)
        return comfy.sd.VAE(sd=sd)
    
    return cache().load_cached(info, load)

class VAENamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> rpc_types.VAE:
        return load_vae(path)
    
    @RPC.autoref
    @RPC.method
    def decode(vae: rpc_types.VAE, samples: rpc_types.LatentTensor, is_circular: bool = False) -> list[rpc_types.ImageTensor]:
        images = vae.decode(samples) if not is_circular else vae_decode_circular(vae, samples)
        
        if len(images.shape) == 5: #Combine batches
            images = images.reshape(-1, images.shape[-3], images.shape[-2], images.shape[-1])
        
        # So we can iterate over this.
        return [value for value in images]

    @RPC.autoref
    @RPC.method
    def encode(vae: rpc_types.VAE, image: rpc_types.ImageTensor, mask: rpc_types.ImageTensor = None) -> rpc_types.Latent:
        # TODO: Refactor when types are added.
        image = image.unsqueeze(0)

        if mask is not None:
            mask = mask.unsqueeze(0)
            return vae_encode_inpaint(vae, image, mask)

        return vae_encode(vae, image)
    
    @RPC.autoref
    @RPC.method
    def decode_tiled(vae: rpc_types.VAE, samples: rpc_types.LatentTensor, tile_size: int, overlap: int, temporal_size: int, temporal_overlap: int) -> list[rpc_types.ImageTensor]:
        if tile_size < overlap * 4:
            overlap = tile_size // 4
        if temporal_size < temporal_overlap * 2:
            temporal_overlap = temporal_overlap // 2
        temporal_compression = vae.temporal_compression_decode()
        if temporal_compression is not None:
            temporal_size = max(2, temporal_size // temporal_compression)
            temporal_overlap = max(1, min(temporal_size // 2, temporal_overlap // temporal_compression))
        else:
            temporal_size = None
            temporal_overlap = None

        compression = vae.spacial_compression_decode()
        images = vae.decode_tiled(samples, tile_x=tile_size // compression, tile_y=tile_size // compression, overlap=overlap // compression, tile_t=temporal_size, overlap_t=temporal_overlap)
        if len(images.shape) == 5: #Combine batches
            images = images.reshape(-1, images.shape[-3], images.shape[-2], images.shape[-1])
        return [value for value in images]
import torch

import comfy.sd
import comfy.utils

def load(settings):
    embedding_directory = None

    if "embeddings_path" in settings:
        embedding_directory = settings["embeddings_path"]

    out = comfy.sd.load_checkpoint_guess_config(settings["path"], output_vae=True, output_clip=False, output_clipvision=True, embedding_directory=embedding_directory)
    return (out[0], out[3], out[2])

def linear_guidance(model, min_cfg):
    def linear_cfg(args):
        cond = args["cond"]
        uncond = args["uncond"]
        cond_scale = args["cond_scale"]

        scale = torch.linspace(min_cfg, cond_scale, cond.shape[0], device=cond.device).reshape((cond.shape[0], 1, 1, 1))
        return uncond + scale * (cond - uncond)

    m = model.clone()
    m.set_model_sampler_cfg_function(linear_cfg)
    return m

def conditioning(clip_vision, vae, image, width, height):
    output = clip_vision.encode_image(image)
    pooled = output.image_embeds.unsqueeze(0)
    pixels = comfy.utils.common_upscale(image.movedim(-1,1), width, height, "bilinear", "center").movedim(1,-1)
    encode_pixels = pixels[:,:,:,:3]
    if augmentation_level > 0:
        encode_pixels += torch.randn_like(pixels) * augmentation_level
    t = vae.encode(encode_pixels)
    positive = [[pooled, {"motion_bucket_id": motion_bucket_id, "fps": fps, "augmentation_level": augmentation_level, "concat_latent_image": t}]]
    negative = [[torch.zeros_like(pooled), {"motion_bucket_id": motion_bucket_id, "fps": fps, "augmentation_level": augmentation_level, "concat_latent_image": torch.zeros_like(t)}]]
    latent = torch.zeros([video_frames, 4, height // 8, width // 8])
    return (positive, negative, {"samples":latent})
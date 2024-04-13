import torch

import comfy.sd
import comfy.sample
import comfy.samplers
import comfy.controlnet
import comfy.clip_vision
import comfy.utils
import comfy.model_management
from .utils import custom, latent_preview
from comfy.cli_args import LatentPreviewMethod

from rpc import RPC

last_checkpoint_path = None
last_checkpoint = None

def load_checkpoint(path, embeddings_path=None):
    return comfy.sd.load_checkpoint_guess_config(path, output_vae=True, output_clip=True, embedding_directory=embeddings_path)

def load_checkpoint_cached(path, embeddings_path=None):
    global last_checkpoint, last_checkpoint_path

    comfy.model_management.cleanup_models()

    if last_checkpoint != None and last_checkpoint_path == path:
        return last_checkpoint

    last_checkpoint = None
    comfy.model_management.cleanup_models()
    
    last_checkpoint_path = path
    last_checkpoint = load_checkpoint(path, embeddings_path)
    return last_checkpoint

def model_set_circular(model, is_circular=False):
    if isinstance(model, torch.nn.Conv2d):
        model.padding_mode = "circular" if is_circular else "zeros"

class CheckpointNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path, embeddings_path=None, clip_layer=None):
        (model, clip, vae, _) = load_checkpoint_cached(path, embeddings_path)
        
        if clip_layer == None or clip_layer == 0:
            clip.clip_layer(None)
        else:
            clip.clip_layer(clip_layer)
        
        return {
            "model": model,
            "clip": clip,
            "vae": vae
        }
    
    @RPC.autoref
    @RPC.method("sample")
    def sample(model, latent, positive, negative, sampler_name, scheduler_name, steps, denoise, cfg, seed, is_circular=False, preview=None):
        model_set_circular(model, is_circular)

        latent_image = latent["samples"]
        noise = comfy.sample.prepare_noise(latent_image, seed, None)

        noise_mask = None
        if "noise_mask" in latent:
            noise_mask = latent["noise_mask"]

        callback = None
        if preview is not None:
            taesd_decoder_path = None
            if preview["method"] == LatentPreviewMethod.TAESD:
                taesd_decoder_name = model.model.latent_format.taesd_decoder_name
                if "taesd" in preview and taesd_decoder_name in preview["taesd"]:
                    taesd_decoder_path = preview["taesd"][taesd_decoder_name]

            callback = latent_preview.prepare_callback(model, preview["method"], steps, taesd_decoder_path=taesd_decoder_path)
        else:
            callback = latent_preview.prepare_callback(model, "none", steps)
        
        sampler = comfy.samplers.sampler_object(sampler_name)

        custom_schedulers = custom.get_custom_schedulers()
        if scheduler_name not in custom_schedulers:
            return comfy.sample.sample(
                model=model,
                noise=noise,
                steps=steps,
                cfg=cfg,
                sampler_name=sampler,
                scheduler=scheduler_name,
                positive=positive,
                negative=negative,
                latent_image=latent_image,
                noise_mask=noise_mask,
                callback=callback,
                disable_pbar=True,
                seed=seed
            )
        else:
            scheduler = custom_schedulers[scheduler_name]
            sigmas = scheduler(model, steps, denoise)
            return comfy.sample.sample_custom(
                model=model,
                noise=noise,
                cfg=cfg,
                sampler=sampler,
                sigmas=sigmas,
                positive=positive,
                negative=negative,
                latent_image=latent_image,
                noise_mask=noise_mask,
                callback=callback,
                disable_pbar=True,
                seed=seed
            )
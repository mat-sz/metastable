import torch
import yaml

import comfy.sd
import comfy.sample
import comfy.samplers
import comfy.controlnet
import comfy.clip_vision
import comfy.utils
import comfy.model_management
from .utils import custom, latent_preview
from comfy.model_base import ModelType

from rpc import RPC

last_checkpoint_path = None
last_checkpoint = None

def apply_config(checkpoint, config_path):
    try:
        (model, clip, vae, clipvision) = checkpoint

        config = {}
        with open(config_path, "r") as stream:
            config = yaml.safe_load(stream)

        params = config["model"]["params"]

        if "parameterization" in params and params["parameterization"] == "v":
            m = model.clone()
            class ModelSamplingAdvanced(comfy.model_sampling.ModelSamplingDiscrete, comfy.model_sampling.V_PREDICTION):
                pass
            m.add_object_patch("model_sampling", ModelSamplingAdvanced(model.model.model_config))
            model = m

        if "cond_stage_config" in params:
            clip_config = params["cond_stage_config"]
            if "params" in clip_config and "layer_idx" in clip_config["params"]:
                layer_idx = clip_config["params"]["layer_idx"]
                if layer_idx is not None:
                    clip.clip_layer(layer_idx)

        return (model, clip, vae, clipvision)
    except:
        return checkpoint

def load_checkpoint(path, embeddings_path=None, config_path=None):
    checkpoint = comfy.sd.load_checkpoint_guess_config(path, output_vae=True, output_clip=True, embedding_directory=embeddings_path)

    if config_path is None:
        return checkpoint
    else:
        return apply_config(checkpoint, config_path)

def load_checkpoint_cached(path, embeddings_path=None, config_path=None):
    global last_checkpoint, last_checkpoint_path

    comfy.model_management.cleanup_models()

    if last_checkpoint != None and last_checkpoint_path == path:
        return last_checkpoint

    last_checkpoint = None
    comfy.model_management.cleanup_models()
    
    last_checkpoint_path = path
    last_checkpoint = load_checkpoint(path, embeddings_path, config_path)
    return last_checkpoint

def model_set_circular(model, is_circular=False):
    if isinstance(model, torch.nn.Conv2d):
        model.padding_mode = "circular" if is_circular else "zeros"

class CheckpointNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path, embeddings_path=None, clip_layer=None, config_path=None):
        (model, clip, vae, _) = load_checkpoint_cached(path, embeddings_path, config_path)

        if model == None:
            raise Exception("Checkpoint loading error: missing model")
        
        if clip == None:
            raise Exception("Checkpoint loading error: missing CLIP")
        
        if vae == None:
            raise Exception("Checkpoint loading error: missing VAE")

        if clip_layer == None or clip_layer == 0:
            clip.clip_layer(None)
        else:
            clip.clip_layer(clip_layer)

        latent_type = "sd"
        if model.model.model_type == ModelType.FLOW:
            latent_type = "sd3"
        
        return {
            "model": model,
            "clip": clip,
            "vae": vae,
            "latent_type": latent_type
        }
    
    @RPC.autoref
    @RPC.method("sample")
    def sample(model, latent, positive, negative, sampler_name, scheduler_name, steps, denoise, cfg, seed, is_circular=False, preview=None):
        model_set_circular(model, is_circular)

        latent_image = latent["samples"]
        latent_image = comfy.sample.fix_empty_latent_channels(model, latent_image)
        noise = comfy.sample.prepare_noise(latent_image, seed, None)

        noise_mask = None
        if "noise_mask" in latent:
            noise_mask = latent["noise_mask"]

        callback = None
        if preview is not None:
            taesd_decoder_path = None
            if preview["method"] == "taesd":
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
                denoise=denoise,
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
from typing import NotRequired, TypedDict
import yaml

import comfy.model_patcher
import comfy.sd
import comfy.sample
import comfy.samplers
import comfy.controlnet
import comfy.clip_vision
import comfy.utils
import comfy.model_management
from .utils.checkpoint import get_latent_type

from rpc import RPC
import rpc_types
from model_cache import cache

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
    info = {
        "path": path,
        "embeddings_path": embeddings_path,
        "config_path": config_path,
    }
  
    def load():
        checkpoint = comfy.sd.load_checkpoint_guess_config(path, output_vae=True, output_clip=True, embedding_directory=embeddings_path)

        if config_path is not None:
            checkpoint = apply_config(checkpoint, config_path)

        return checkpoint
    
    return cache().load_cached(info, load)

class CheckpointLoadResult(TypedDict):
    diffusion_model: rpc_types.DiffusionModel
    text_encoder: NotRequired[rpc_types.TextEncoder]
    vae: NotRequired[rpc_types.VAE]
    latent_type: str

class CheckpointNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str, embeddings_path: str = None, config_path: str = None) -> CheckpointLoadResult:
        (diffusion_model, text_encoder, vae, _) = load_checkpoint(path, embeddings_path, config_path)

        return {
            "diffusion_model": diffusion_model,
            "text_encoder": text_encoder,
            "vae": vae,
            "latent_type": get_latent_type(diffusion_model)
        }
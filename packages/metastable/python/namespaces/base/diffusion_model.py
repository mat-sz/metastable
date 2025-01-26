from typing import TypedDict
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

def load_diffusion_model(path, model_options={}):
    info = {
        "path": path,
    }

    def load():
        if path.endswith('.gguf'):
            try:
                from .utils.gguf import load_diffusion_model
                return load_diffusion_model(path)
            except ImportError as e:
                raise ValueError(f"Missing GGUF support.")
        else:
            return comfy.sd.load_diffusion_model(path, model_options=model_options)
    
    return cache().load_cached(info, load)

class DiffusionModelLoadResult(TypedDict):
    diffusion_model: rpc_types.DiffusionModel
    latent_type: str

class DiffusionModelNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> DiffusionModelLoadResult:
        diffusion_model = load_diffusion_model(path)

        return {
            "diffusion_model": diffusion_model,
            "latent_type": get_latent_type(diffusion_model)
        }
import comfy.sd
import comfy.sample
import comfy.samplers
import comfy.controlnet
import comfy.clip_vision
import comfy.utils
import comfy.model_management
from .utils.checkpoint import get_latent_type

from rpc import RPC

last_unet_path = None
last_unet = None

def load_unet_cached(path, model_options={}):
    global last_unet, last_unet_path

    comfy.model_management.cleanup_models()

    if last_unet != None and last_unet_path == path:
        return last_unet

    last_unet = None
    comfy.model_management.cleanup_models()
    
    last_unet_path = path
    last_unet = comfy.sd.load_diffusion_model(path, model_options=model_options)
    return last_unet

class DiffusionModelNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        diffusion_model = load_unet_cached(path)

        return {
            "diffusion_model": diffusion_model,
            "latent_type": get_latent_type(diffusion_model)
        }

from comfy.model_base import ModelType

def get_latent_type(diffusion_model):
    unet_config = diffusion_model.model.model_config.unet_config
    image_model_type = unet_config["image_model"] if "image_model" in unet_config else None
    
    if image_model_type == "hunyuan_video":
        return "hunyuan_video"
    elif diffusion_model.model.model_type == ModelType.FLOW:
        return "sd3"
    
    return "sd"
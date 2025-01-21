import comfy.sd

from .ops import GGMLOps
from .loader import gguf_sd_loader, gguf_clip_loader
from .patcher import GGUFModelPatcher

def load_diffusion_model(path):
    ops = GGMLOps()

    ops.Linear.dequant_dtype = None
    ops.Linear.patch_dtype = None
    sd = gguf_sd_loader(path)
    model = comfy.sd.load_diffusion_model_state_dict(
        sd, model_options={"custom_operations": ops}
    )
    if model is None:
        raise RuntimeError("ERROR: Could not detect model type")
    model = GGUFModelPatcher.clone(model)
    model.patch_on_device = None
    return model

def load_text_encoder(paths, type, embeddings_path):
    clip_data = []
    for p in paths:
        if p.endswith(".gguf"):
            sd = gguf_clip_loader(p)
        else:
            sd = comfy.utils.load_torch_file(p, safe_load=True)
        clip_data.append(sd)

    clip = comfy.sd.load_text_encoder_state_dicts(
        clip_type = type,
        state_dicts = clip_data,
        model_options = {
            "custom_operations": GGMLOps,
            "initial_device": comfy.model_management.text_encoder_offload_device()
        },
        embedding_directory = embeddings_path,
    )
    clip.patcher = GGUFModelPatcher.clone(clip.patcher)
    return clip
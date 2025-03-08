from typing import TypedDict
import comfy.model_patcher
import comfy.sd
import comfy.utils

from rpc import RPC
import rpc_types
from model_cache import cache

def load_lora(path: str):
    info = {
        "path": path,
    }

    def load():
        return comfy.utils.load_torch_file(path, safe_load=True)
    
    return cache().load_cached(info, load)

class LoraApplyResult(TypedDict):
    diffusion_model: rpc_types.DiffusionModel
    text_encoder: rpc_types.TextEncoder

class LORANamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> rpc_types.LORA:
        return load_lora(path)

    @RPC.autoref
    @RPC.method
    def apply(diffusion_model: rpc_types.DiffusionModel, text_encoder: rpc_types.TextEncoder, lora: rpc_types.LORA, strength: float) -> LoraApplyResult:
        (diffusion_model, text_encoder) = comfy.sd.load_lora_for_models(diffusion_model, text_encoder, lora, strength, strength)
        return {
            "diffusion_model": diffusion_model,
            "text_encoder": text_encoder
        }
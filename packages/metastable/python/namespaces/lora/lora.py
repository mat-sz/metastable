from typing import TypedDict
import comfy.model_patcher
import comfy.sd
import comfy.utils

from rpc import RPC

class LoraApplyResult(TypedDict):
    diffusion_model: comfy.model_patcher.ModelPatcher
    text_encoder:comfy.sd.CLIP

class LORANamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str):
        return comfy.utils.load_torch_file(path, safe_load=True)

    @RPC.autoref
    @RPC.method
    def apply(diffusion_model: comfy.model_patcher.ModelPatcher, text_encoder: comfy.sd.CLIP, lora, strength: float) -> LoraApplyResult:
        (diffusion_model, text_encoder) = comfy.sd.load_lora_for_models(diffusion_model, text_encoder, lora, strength, strength)
        return {
            "diffusion_model": diffusion_model,
            "text_encoder": text_encoder
        }
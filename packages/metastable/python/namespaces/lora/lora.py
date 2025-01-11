import comfy.sd
import comfy.utils

from rpc import RPC

class LORANamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        return comfy.utils.load_torch_file(path, safe_load=True)

    @RPC.autoref
    @RPC.method("apply")
    def apply(diffusion_model, text_encoder, lora, strength):
        (diffusion_model, text_encoder) = comfy.sd.load_lora_for_models(diffusion_model, text_encoder, lora, strength, strength)
        return {
            "diffusion_model": diffusion_model,
            "text_encoder": text_encoder
        }
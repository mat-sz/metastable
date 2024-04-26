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
    def apply(model, clip, lora, strength):
        (model, clip) = comfy.sd.load_lora_for_models(model, clip, lora, strength, strength)
        return {
            "model": model,
            "clip": clip
        }
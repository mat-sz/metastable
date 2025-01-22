import comfy.clip_vision

from rpc import RPC

class CLIPVisionNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> comfy.clip_vision.ClipVisionModel:
        return comfy.clip_vision.load(path)
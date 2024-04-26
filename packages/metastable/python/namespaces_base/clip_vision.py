import comfy.clip_vision

from rpc import RPC

class CLIPVisionNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        return comfy.clip_vision.load(path)
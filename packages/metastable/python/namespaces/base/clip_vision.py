import comfy.clip_vision

from rpc import RPC
import rpc_types

class CLIPVisionNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> rpc_types.ClipVisionModel:
        return comfy.clip_vision.load(path)
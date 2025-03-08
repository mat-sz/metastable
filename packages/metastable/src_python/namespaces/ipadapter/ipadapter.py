from .utils.ipadapter import load, apply

from rpc import RPC
import rpc_types

class IPAdapterNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str) -> rpc_types.IpAdapter:
        return load(path)

    @RPC.autoref
    @RPC.method
    def apply(diffusion_model: rpc_types.DiffusionModel, ipadapter: rpc_types.IpAdapter, clip_vision: rpc_types.ClipVisionModel, image: rpc_types.ImageTensor, strength: float) -> rpc_types.DiffusionModel:
        # TODO: Refactor when types are added.
        image = image.unsqueeze(0)
        
        return apply(ipadapter, diffusion_model, strength, clip_vision, image)
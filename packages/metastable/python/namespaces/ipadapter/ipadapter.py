from .utils.ipadapter import load, apply

from rpc import RPC

class IPAdapterNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        return load(path)

    @RPC.autoref
    @RPC.method("apply")
    def ipadapter_apply(diffusion_model, ipadapter, clip_vision, image, strength):
        # TODO: Refactor when types are added.
        image = image.unsqueeze(0)
        
        return apply(ipadapter, diffusion_model, strength, clip_vision, image)
from .utils import ipadapter as ipadapter_fns

from rpc import RPC

class IPAdapterNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        return ipadapter_fns.load(path)

    @RPC.autoref
    @RPC.method("apply")
    def ipadapter_apply(model, ipadapter, clip_vision, image, strength):
        return {
            "model": ipadapter_fns.apply(ipadapter, model, strength, clip_vision, image)
        }
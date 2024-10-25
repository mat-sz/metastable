from .upscale_model import UpscaleModelNamespace

def insert_all(rpc):
    rpc.add_namespace('upscale_model', UpscaleModelNamespace)
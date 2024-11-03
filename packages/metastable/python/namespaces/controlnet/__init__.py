from .controlnet import ControlnetNamespace

def insert_all(rpc):
    rpc.add_namespace('controlnet', ControlnetNamespace)
from .lora import LORANamespace

def insert_all(rpc):
    rpc.add_namespace('lora', LORANamespace)
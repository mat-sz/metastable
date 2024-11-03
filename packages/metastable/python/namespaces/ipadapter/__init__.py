from .ipadapter import IPAdapterNamespace

def insert_all(rpc):
    rpc.add_namespace('ipadapter', IPAdapterNamespace)
from .tagger import TaggerNamespace

def insert_all(rpc):
    rpc.add_namespace('tagger', TaggerNamespace)
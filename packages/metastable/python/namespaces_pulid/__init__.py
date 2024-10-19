from pulid import PulidNamespace

def insert_all(rpc):
    rpc.add_namespace('pulid', PulidNamespace)
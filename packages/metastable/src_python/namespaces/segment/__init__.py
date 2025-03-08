from .segment import SegmentNamespace

def insert_all(rpc):
    rpc.add_namespace('segment', SegmentNamespace)
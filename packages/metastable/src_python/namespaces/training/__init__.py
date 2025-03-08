from .training import TrainingNamespace

def insert_all(rpc):
    rpc.add_namespace('training', TrainingNamespace)

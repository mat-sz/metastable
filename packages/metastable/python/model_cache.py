from typing import Callable
import gc
import comfy.model_sampling
import comfy.sd
import comfy.model_management
import rpc_types

def remove_none_from_dict(target: dict[str, any]) -> dict[str, any]:
    new_dict = {}
    for key, value in target.items():
        if value is not None:
            new_dict[key] = value
    return new_dict

class ModelCache:
    info: dict[str, rpc_types.CachedModelInfo] = {}
    models: dict[str, any] = {}

    def comfy_cleanup(self):
        comfy.model_management.cleanup_models()

    def add(self, model, info: rpc_types.CachedModelInfo):
        path = info["path"]
        self.models[path] = model
        self.info[path] = info
        self.comfy_cleanup()

    def remove(self, path: str, cleanup: bool = True):
        if path in self.info:
            del self.info[path]
        if path in self.models:
            del self.models[path]
        if cleanup:
            self.comfy_cleanup()

    def has(self, path: str):
        return path in self.info and path in self.models

    def check(self, new_info: rpc_types.CachedModelInfo):
        path = new_info["path"]
        if self.has(path):
            old_info = remove_none_from_dict(self.info[path])
            new_info = remove_none_from_dict(new_info)
            return old_info == new_info

        return False

    def get(self, info: rpc_types.CachedModelInfo):
        path = info["path"]
        if self.check(info):
            return self.models[path]

        return None
    
    def clear(self):
        self.models = {}
        self.info = {}
        comfy.model_management.unload_all_models()

    def remove_all_except_for(self, infos: list[rpc_types.CachedModelInfo]):
        info_map = {}
        for info in infos:
            info_map[info["path"]] = info

        for key in self.info.copy().keys():
            if key not in info_map or not self.check(info_map[key]):
                self.remove(key, False)
        
        comfy.model_management.unload_all_models()

    def load_cached(self, info: rpc_types.CachedModelInfo, load_function: Callable[[], any]):
        cached = self.get(info)
        if cached:
            return cached
        
        model = load_function()
        self.add(model, info)
        return model

model_cache = ModelCache()

def cache() -> ModelCache:
    return model_cache
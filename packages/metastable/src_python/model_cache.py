from typing import Callable, NotRequired, TypedDict
import comfy.model_sampling
import comfy.sd
import comfy.model_management
import comfy.model_patcher
import rpc_types
import output

def remove_none_from_dict(target: dict[str, any]) -> dict[str, any]:
    new_dict = {}
    for key, value in target.items():
        if value is not None:
            new_dict[key] = value
    return new_dict

def get_models(obj) -> list[any]:
    if isinstance(obj, list) or isinstance(obj, tuple):
        items = [x for x in obj]
        models = []
        for item in items:
            models += get_models(item)

        return models
    elif isinstance(obj, comfy.model_patcher.ModelPatcher):
        return [obj]
    elif hasattr(obj, 'patcher'):
        return [obj.patcher]
    else:
        return [obj]

# def get_loaded_model(model) -> comfy.model_management.LoadedModel | None:
#     filtered = [x for x in comfy.model_management.current_loaded_models if x.model == model]
#     if len(filtered) == 0:
#         return None

#     return filtered[0]

def model_size(obj) -> int:
    models = get_models(obj)
    size = 0

    for item in models:
        if isinstance(item, dict):
            for k in item:
                t = item[k]
                size += t.nelement() * t.element_size()
        elif hasattr(item, 'model_size'):
            size += item.model_size()
        elif hasattr(item, 'state_dict'):
            size += model_size(item.state_dict())

    return size

class LoadedModelInfo(TypedDict):
    path: str
    size: NotRequired[int | None]

class ModelCache:
    info: dict[str, rpc_types.CachedModelInfo] = {}
    models: dict[str, any] = {}

    def comfy_cleanup(self):
        comfy.model_management.cleanup_models()

    def emit_event(self):
        output.write_event("model_cache_change")

    def add(self, model, info: rpc_types.CachedModelInfo):
        path = info["path"]
        self.models[path] = model
        self.info[path] = info
        self.comfy_cleanup()
        self.emit_event()

    def remove(self, path: str, cleanup: bool = True):
        if path in self.info:
            del self.info[path]
        if path in self.models:
            del self.models[path]
        if cleanup:
            self.comfy_cleanup()
        self.emit_event()

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
        self.emit_event()

    def model_info(self, path: str) -> LoadedModelInfo | None:
        model = self.models[path]
        if not model:
            return None

        return {
            "path": path,
            "size": model_size(model)
        }

    def remove_all_except_for(self, infos: list[rpc_types.CachedModelInfo]):
        info_map = {}
        for info in infos:
            info_map[info["path"]] = info

        for key in self.info.copy().keys():
            if key not in info_map or not self.check(info_map[key]):
                self.remove(key, False)

        comfy.model_management.unload_all_models()
        self.emit_event()

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

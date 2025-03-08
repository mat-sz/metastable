import inspect
from io import BytesIO
from types import UnionType
from typing import NotRequired, get_origin, get_args, is_typeddict
import output
output.configure(1)

import sys
import os
import cli_args
sys.modules['comfy.cli_args'] = cli_args
args = cli_args.args

from rpc import RPC
from inspect import signature
import importlib.util
import json

rpc = RPC()

namespaces_dir = os.path.join(os.path.dirname(__file__), 'namespaces')
namespaces = os.listdir(namespaces_dir)

for namespace in namespaces:
    name = f'namespaces.{namespace}'
    spec = importlib.util.spec_from_file_location(name, os.path.join(namespaces_dir, namespace, '__init__.py'))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    mod.insert_all(rpc)

def annotation_to_js_type(annotation):
    if annotation == int or annotation == float:
        return { "type": "number" }
    elif annotation == str:
        return { "type": "string" }
    elif annotation == bool:
        return { "type": "boolean" }
    elif annotation == BytesIO:
        return { "type": "bytes" }
    elif annotation is None:
        return { "type": "null" }
    elif is_typeddict(annotation):
        type_def = {
            "type": "object",
            "properties": {},
            "required": list(annotation.__required_keys__)
        }
        
        for name, value in annotation.__annotations__.items():
            if get_origin(value) == NotRequired:
                value = get_args(value)[0]
            
            type_def["properties"][name] = annotation_to_js_type(value)
        
        return type_def
    elif get_origin(annotation) == dict:
        args = get_args(annotation)
        type_def = {
            "type": "object",
        }

        if len(args) == 2:
            type_def["additionalProperties"] = annotation_to_js_type(args[0])

        return type_def
    elif get_origin(annotation) == list:
        args = get_args(annotation)
        type_def = {
            "type": "array",
        }

        if len(args) == 1:
            type_def["items"] = annotation_to_js_type(args[0])

        return type_def
    elif get_origin(annotation) == tuple:
        args = get_args(annotation)
        type_def = {
            "type": "array",
        }

        if len(args) > 0:
            type_def["prefixItems"] = [annotation_to_js_type(arg) for arg in args]

        return type_def
    elif isinstance(annotation, UnionType):
        return {
            "type": "union",
            "anyOf": [annotation_to_js_type(arg) for arg in annotation.__args__]
        }

    if annotation is not inspect._empty:
        return {
            "type": "ref",
            "tag": annotation.__name__
        }

    return { "type": "any" }

namespace_defs = {}
for namespace_name, namespace in rpc.namespaces.items():
    method_defs = {}
    
    for method_name, method in namespace.methods.items():
        full_name = f'{namespace_name}:{method_name}'
        sig = signature(method.func)

        params_schema = {
            "type": "object",
            "properties": {},
            "required": [],
        }

        for param in sig.parameters.values():
            if param.name.startswith("_"):
                continue

            if param.default is param.empty:
                params_schema["required"].append(param.name)
            
            params_schema["properties"][param.name] = annotation_to_js_type(param.annotation)
        
        method_defs[method_name] = {
            "parameters": params_schema,
            "returns": annotation_to_js_type(sig.return_annotation),
            "is_autoref": method.is_autoref,
        }

    namespace_defs[namespace_name] = {
        "methods": method_defs
    }

print(json.dumps({
    "namespaces": namespace_defs
}))
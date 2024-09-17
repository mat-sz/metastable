from io import BytesIO
import base64
import torch
import inspect
import output
import traceback

import rpc_hook

PRIMITIVES = (bool, str, int, float, type(None))

def is_key(obj, key, type):
    return key in obj and isinstance(obj[key], type)

class RPCContext:
    def __init__(self, request_id, session_id):
        self.request_id = request_id
        self.session_id = session_id

    def progress(self, value, total):
        output.write_event("rpc.progress", { "requestId": self.request_id, "sessionId": self.session_id, "value": value, "max": total })
class RPCNamespace:
    def __init__(self, obj):
        self.object = obj
        self.methods = {}
        self.is_autoref = {}

        for func_name in dir(obj):
            func = getattr(obj, func_name)
            if callable(func):
                method_name = getattr(func, "_rpc_name", None)
                if method_name is not None:
                    self.methods[method_name] = func

                    method_autoref = getattr(func, "_rpc_autoref", False)
                    self.is_autoref[method_name] = method_autoref

    def invoke(self, method_name, params, context=None, session=None):
        if method_name not in self.methods:
            raise Exception("Method not found")

        is_autoref = self.is_autoref[method_name]
        if is_autoref:
            if session is None:
                raise Exception("Method requires a session to be open")

            params = session.autoexpand(params)
        
        result = None
        method = self.methods[method_name]
        args = inspect.getfullargspec(method)
        
        with torch.inference_mode():
            if isinstance(params, dict):
                if "ctx" in args[0]:
                    params["ctx"] = context
                
                result = method(**params)
            else:
                result = method(*params)

        if is_autoref:
            result = session.autoalloc(result)

        return result

class RPCSession:
    def __init__(self):
        self.references = {}
        self.current = 0

    def alloc(self, obj):
        if isinstance(obj, BytesIO):
            return { "$bytes": base64.b64encode(obj.getvalue()).decode() }
        
        key = self.current
        self.references[key] = obj
        self.current += 1
        return { "$ref": key }

    def autoalloc(self, obj):
        if isinstance(obj, PRIMITIVES):
            return obj
        elif isinstance(obj, dict):
            return { key: self.autoalloc(value) for key, value in obj.items() }
        elif isinstance(obj, list) or isinstance(obj, tuple):
            return [self.autoalloc(value) for value in obj]
        else:
            return self.alloc(obj)
    
    def autoexpand(self, obj):
        if isinstance(obj, PRIMITIVES):
            return obj
        elif isinstance(obj, dict):
            if is_key(obj, "$ref", int):
                return self.references[obj["$ref"]]
            elif is_key(obj, "$bytes", str):
                return BytesIO(base64.b64decode(obj["$bytes"]))
            
            return { key: self.autoexpand(value) for key, value in obj.items() }
        elif isinstance(obj, list) or isinstance(obj, tuple):
            return [self.autoexpand(value) for value in obj]
        else:
            return self.autoexpand(obj)

class RPC:
    def method(name):
        def decorator(func):
            func._rpc_name = name
            return func
        return decorator

    def autoref(func):
        func._rpc_autoref = True
        return func

    def __init__(self):
        self.sessions = {}
        self.namespaces = {}

    def add_namespace(self, name, obj):
        self.namespaces[name] = RPCNamespace(obj)

    def handle(self, request):
        if (not isinstance(request, dict) or "id" not in request
            or "type" not in request or request["type"] != "rpc"
            or "method" not in request):
            raise Exception("Invalid request")

        request_id = request["id"]
        try:
            method = request["method"]
            session_id = request["session"] if "session" in request else None
            session = None
            
            if session_id is not None:
                if method == "session:start":
                    self.sessions[session_id] = RPCSession()

                    return {
                        "type": "rpc",
                        "id": request_id,
                        "result": session_id
                    }
                elif method == "session:destroy":
                    del self.sessions[session_id]

                    return {
                        "type": "rpc",
                        "id": request_id,
                    }
                
                if session_id not in self.sessions:
                    raise Exception("Session not found")
                
                session = self.sessions[session_id]

            method_namespace, method_name = method.split(":")
            
            if method_namespace not in self.namespaces:
                raise Exception("Namespace not found")
                
            namespace = self.namespaces[method_namespace]
            
            params = []
            if "params" in request:
                params = request["params"]

            with rpc_hook.use(request_id, session_id):
                result = namespace.invoke(method_name, params, RPCContext(request_id, session_id), session)

            return {
                "type": "rpc",
                "id": request_id,
                "result": result
            }
        except Exception:
            return {
                "type": "rpc",
                "id": request_id,
                "error": {
                    "message": traceback.format_exc(),
                }
            }
        

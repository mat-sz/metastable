from io import BytesIO
import base64
import torch
import inspect
import output
import traceback
from uuid import uuid4

import rpc_hook
import comfy.model_management

PRIMITIVES = (bool, str, int, float, type(None))

def is_key(obj, key, type):
    return key in obj and isinstance(obj[key], type)

class RPCContext:
    request_id: str
    session_id: str | None
    
    def __init__(self, request_id, session_id, rpc):
        self.request_id = request_id
        self.session_id = session_id
        self.rpc = rpc

    def progress(self, value, total):
        output.write_event("rpc.progress", {
            "requestId": self.request_id,
            "sessionId": self.session_id,
            "value": value,
            "max": total
        })

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

class RPCMethod:
    func: callable
    is_autoref: bool
    args: inspect.FullArgSpec
    
    def __init__(self, func):
        self.func = func
        self.is_autoref = getattr(func, "_rpc_autoref", False)
        self.args = inspect.getfullargspec(func)

    def invoke(self, params: dict, context: RPCContext = None, session: RPCSession = None):
        if self.is_autoref:
            if session is None:
                raise Exception("Method requires a session to be open")

            params = session.autoexpand(params)
        
        result = None
        
        with torch.inference_mode():
            if "_ctx" in self.args[0]:
                params["_ctx"] = context
            
            result = self.func(**params)

        if self.is_autoref:
            result = session.autoalloc(result)

        return result

class RPCNamespace:
    methods: dict[str, RPCMethod]

    def __init__(self, obj):
        self.object = obj
        self.methods = {}

        for func_name in dir(obj):
            func = getattr(obj, func_name)
            if callable(func):
                method_name = getattr(func, "_rpc_name", None)
                if method_name is not None:
                    self.methods[method_name] = RPCMethod(func)
    
    def get_method(self, method_name: str):
        if method_name not in self.methods:
            raise Exception("Method not found")
        
        return self.methods[method_name]

class RPC:
    sessions: dict[str, RPCSession]
    namespaces: dict[str, RPCNamespace]

    def method(name_or_function = None):
        def decorator(func):
            if name_or_function:
                func._rpc_name = name_or_function
            else:
                func._rpc_name = func.__name__
            return func
        
        if callable(name_or_function):
            name_or_function._rpc_name = name_or_function.__name__
            return name_or_function

        return decorator

    def autoref(func):
        func._rpc_autoref = True
        return func

    def __init__(self):
        self.sessions = {}
        self.namespaces = {}

        self.add_namespace("session", SessionNamespace)

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

            method_namespace, method_name = method.split(":")
            
            if method_namespace not in self.namespaces:
                raise Exception("Namespace not found")

            if session_id is not None:
                if session_id in self.sessions:
                    session = self.sessions[session_id]
                elif method_namespace != 'session':
                    raise Exception("Session not found")
                
            namespace = self.namespaces[method_namespace]
            params = {}
            
            if "params" in request:
                params = request["params"]

            with rpc_hook.use(request_id, session_id):
                ctx = RPCContext(
                    request_id=request_id,
                    session_id=session_id,
                    rpc=self
                )
                method = namespace.get_method(method_name)
                result = method.invoke(params, ctx, session)

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

class SessionNamespace:
    @RPC.method
    def start(_ctx: RPCContext) -> str:
        session_id = str(uuid4())
        comfy.model_management.interrupt_current_processing(False)
        _ctx.rpc.sessions[session_id] = RPCSession()
        return session_id
    
    @RPC.method
    def destroy(_ctx: RPCContext) -> None:
        comfy.model_management.interrupt_current_processing(True)
        del _ctx.rpc.sessions[_ctx.session_id]

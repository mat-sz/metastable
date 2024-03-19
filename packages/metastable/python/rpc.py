def permission(permission_required):
    def decorator(func):
        func.permission_required = permission_required
        return func
    return decorator

class RPCNamespace:
    def __init__(self, obj):
        self.object = obj
        self.methods = {}

        for func_name in dir(obj):
            func = getattr(obj, func_name)
            if callable(func):
                method_name = getattr(func, "rpc_name", None)
                if method_name is not None:
                    self.methods[method_name] = func

    def invoke(self, method_name, *args):
        if method_name not in self.methods:
            raise Exception("Method not found")

        return self.methods[method_name](*args)

PRIMITIVES = (bool, str, int, float, type(None))

class RPCSession:
    def __init__(self):
        self.references = {}
        self.current = 0

    def alloc(self, obj):
        key = self.current
        self.references[key] = obj
        self.current += 1
        return { "__ref": key }

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
            if "__ref" in obj and isinstance(obj["__ref"], int):
                return self.references[obj["__ref"]]
            
            return { key: self.autoexpand(value) for key, value in obj.items() }
        elif isinstance(obj, list) or isinstance(obj, tuple):
            return [self.autoexpand(value) for value in obj]
        else:
            return self.autoexpand(obj)

class RPC:
    def method(name):
        def decorator(func):
            func.rpc_name = name
            return func
        return decorator

    def __init__(self):
        self.sessions = {}
        self.namespaces = {}

    def session(self, session_id):
        if session_id not in self.sessions:
            self.sessions[session_id] = RPCSession()
        
        return self.sessions[session_id]

    def add_namespace(self, name, obj):
        self.namespaces[name] = RPCNamespace(obj)

    def handle(self, request):
        if (not isinstance(request, dict) or "id" not in request
            or "rpc" not in request  or "method" not in request):
            raise Exception("Invalid request")

        request_id = request["id"]
        try:
            method = request["method"]
            session_id = request["session"]
            if method == "session:start":
                self.sessions[session_id] = RPCSession()

                return {
                    "rpc": True,
                    "id": request_id,
                    "result": session_id
                }

            if session_id not in self.sessions:
                raise Exception("Session not found")
            
            session = self.sessions[session_id]
            method_namespace, method_name = method.split(":")

            if method == "session:destroy":
                del self.sessions[session_id]

                return {
                    "rpc": True,
                    "id": request_id,
                }
            
            if method_namespace not in self.namespaces:
                raise Exception("Namespace not found")

            params = []
            if "params" in request:
                params = session.autoexpand(request["params"])
            
            namespace = self.namespaces[method_namespace]
            result = namespace.invoke(method_name, *params)

            return {
                "rpc": True,
                "id": request_id,
                "result": session.autoalloc(result)
            }
        except Exception as error:
            return {
                "rpc": True,
                "id": request_id,
                "error": {
                    "message": type(error).__name__ + "\n" + str(error),
                }
            }
            traceback.print_exc()
        

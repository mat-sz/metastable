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

class RPC:
    def method(name):
        def decorator(func):
            func.rpc_name = name
            return func
        return decorator

    def __init__(self):
        self.namespaces = {}

    def add_namespace(self, name, obj):
        self.namespaces[name] = RPCNamespace(obj)

    def handle(self, request):
        if not isinstance(request, dict) or "id" not in request or "rpc" not in request:
            raise Exception("Invalid request")

        request_id = request["id"]
        try:
            method_namespace, method = request["method"].split(":")
            
            if method_namespace not in self.namespaces:
                raise Exception("Namespace not found")

            params = []
            if "params" in request:
                params = request["params"]
            
            namespace = self.namespaces[method_namespace]
            result = namespace.invoke(method, *params)
            return {
                "rpc": True,
                "id": request_id,
                "result": result
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
        

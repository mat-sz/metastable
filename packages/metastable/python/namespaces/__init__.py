import os
import inspect

def insert_all(rpc):
    for module in os.listdir(os.path.dirname(__file__)):
        if module == '__init__.py' or not module.endswith('.py'):
            continue

        name = module[:-3]
        mod = __import__(name, globals(), locals(), level=1)
        classes = [cls for _, cls in inspect.getmembers(mod, inspect.isclass)
                    if cls.__module__ == mod.__name__ and cls.__name__.endswith('Namespace')]
        rpc.add_namespace(name, classes[0])
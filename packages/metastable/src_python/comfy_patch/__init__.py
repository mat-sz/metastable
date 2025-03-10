import sys
from types import ModuleType
import importlib
import importlib.util

PATCHED_PACKAGES = ["cli_args"]

class RenamedFinder:
    @classmethod
    def find_spec(cls, fullname, path, target=None):
        split = fullname.split('.')

        if split[0] == "comfy" and len(split) > 1 and split[1] in PATCHED_PACKAGES:
            new_base = "comfy_patch"
            renamed = ".".join([new_base, *split[1:]])

            if renamed is not None:
                spec = importlib.util.find_spec(renamed)
                spec.loader = cls
                return spec

        return None

    @staticmethod
    def create_module(spec):
        return importlib.import_module(spec.name)

    @staticmethod
    def exec_module(module):
        pass

sys.meta_path.insert(0, RenamedFinder())

def get_args():
    import comfy.cli_args
    return comfy.cli_args.args

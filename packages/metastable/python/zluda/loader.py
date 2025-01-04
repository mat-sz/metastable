import os
import sys
import ctypes
from comfy.cli_args import args

def get_targets():
    HIPSDK_TARGETS = []
    ZLUDA_TARGETS = []

    if sys.platform == 'win32':
        HIPSDK_TARGETS = ['rocblas.dll', 'rocsolver.dll', f'hiprtc{"".join([v.zfill(2) for v in args.hip_version.split(".")])}.dll']
        ZLUDA_TARGETS = ['nvcuda.dll', 'nvml.dll', 'cublas64_11.dll', 'cusparse64_11.dll', 'nvrtc64_112_0.dll']
    
    return (HIPSDK_TARGETS, ZLUDA_TARGETS)
    

def load() -> None:
    os.environ["ZLUDA_COMGR_LOG_LEVEL"] = "1"

    (HIPSDK_TARGETS, ZLUDA_TARGETS) = get_targets()

    for v in HIPSDK_TARGETS:
        ctypes.windll.LoadLibrary(os.path.join(args.hip_path, 'bin', v))
    for v in ZLUDA_TARGETS:
        ctypes.windll.LoadLibrary(os.path.join(args.zluda_path, v))

def conceal():
    import torch # pylint: disable=unused-import
    platform = sys.platform
    sys.platform = ""
    from torch.utils import cpp_extension
    sys.platform = platform
    cpp_extension.IS_WINDOWS = platform == "win32"
    cpp_extension.IS_MACOS = False
    cpp_extension.IS_LINUX = platform.startswith('linux')
    def _join_rocm_home(*paths) -> str:
        return os.path.join(cpp_extension.ROCM_HOME, *paths)
    cpp_extension._join_rocm_home = _join_rocm_home # pylint: disable=protected-access

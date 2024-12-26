import sys
from typing import Union
import torch
from torch._prims_common import DeviceLikeType
from hijacks import do_hijack
from comfy.model_management import get_torch_device
from comfy.cli_args import args

PLATFORM = sys.platform
do_nothing = lambda _: None # pylint: disable=unnecessary-lambda-assignment

def test(device: DeviceLikeType) -> Union[Exception, None]:
    device = torch.device(device)
    try:
        ten1 = torch.randn((2, 4,), device=device)
        ten2 = torch.randn((4, 8,), device=device)
        out = torch.mm(ten1, ten2)
        assert out.sum().is_nonzero()
        return None
    except Exception as e:
        return e


def initialize_zluda():
    device = get_torch_device()

    do_hijack()

    if PLATFORM == "win32":
        torch.backends.cudnn.enabled = False
        torch.backends.cuda.enable_flash_sdp(False)
        torch.backends.cuda.enable_flash_sdp = do_nothing
        torch.backends.cuda.enable_math_sdp(True)
        torch.backends.cuda.enable_math_sdp = do_nothing
        torch.backends.cuda.enable_mem_efficient_sdp(False)
        torch.backends.cuda.enable_mem_efficient_sdp = do_nothing
        if hasattr(torch.backends.cuda, "enable_cudnn_sdp"):
            torch.backends.cuda.enable_cudnn_sdp(False)
            torch.backends.cuda.enable_cudnn_sdp = do_nothing

        result = test(device)
        if result is not None:
            print(f'ZLUDA device failed to pass basic operation test: index={device.index}, device_name={torch.cuda.get_device_name(device)}')
            print(result)
            torch.cuda.is_available = lambda: False
            args.cpu = True
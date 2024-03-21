import comfy.samplers
import custom

from helpers import get_torch_info
from rpc import RPC

class InstanceNamespace:
  @RPC.method("info")
  def info():
    return {
      "torch": get_torch_info(),
      "samplers": comfy.samplers.KSampler.SAMPLERS,
      "schedulers": comfy.samplers.KSampler.SCHEDULERS + list(custom.get_custom_schedulers().keys())
    }
  
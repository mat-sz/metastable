from typing import NotRequired, TypedDict, NewType

import comfy.model_patcher
import comfy.sd
import comfy.samplers
import comfy.clip_vision
import comfy.controlnet
import torch

ImageTensor = NewType('ImageTensor', torch.Tensor)
LatentTensor = NewType('LatentTensor', torch.Tensor)
ClipVisionModel = NewType('ClipVisionModel', comfy.clip_vision.ClipVisionModel)
DiffusionModel = NewType('DiffusionModel', comfy.model_patcher.ModelPatcher)
VAE = NewType('VAE', comfy.sd.VAE)
TextEncoder = NewType('TextEncoder', comfy.sd.CLIP)
Guider = NewType('Guider', comfy.samplers.CFGGuider)
Noise = NewType('Noise', any)
Sampler = NewType('Sampler', any)
Sigmas = NewType('Sigmas', any)
Conditioning = NewType('Conditioning', any)
ControlNet = NewType('ControlNet', comfy.controlnet.ControlNet)
IpAdapter = NewType('IpAdapter', any)
LORA = NewType('LORA', any)
UpscaleModel = NewType('UpscaleModel', any)
SegmentModel = NewType('SegmentModel', any)
FaceAnalysis = NewType('FaceAnalysis', any)
EvaClip = NewType('EvaClip', any)
PULID = NewType('PULID', any)

class Latent(TypedDict):
    samples: LatentTensor
    noise_mask: NotRequired[LatentTensor]

class ConditioningPair(TypedDict):
    positive: Conditioning
    negative: Conditioning

class PreviewSettings(TypedDict):
    method: str
    taesd: NotRequired[dict[str, str]]
from typing import NotRequired, TypedDict

import torch

class Latent(TypedDict):
    samples: torch.Tensor
    noise_mask: NotRequired[torch.Tensor]
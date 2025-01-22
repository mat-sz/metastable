from typing import TypedDict
from PIL import Image, ImageOps
import numpy as np
import torch
from io import BytesIO

from rpc import RPC

class ImageLoadResult(TypedDict):
    image: torch.Tensor
    mask: torch.Tensor

class ImageNamespace:
    @RPC.autoref
    @RPC.method
    def load(data: BytesIO) -> ImageLoadResult:
        i = Image.open(data)
        i = ImageOps.exif_transpose(i)
        image = i.convert("RGB")
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)

        if 'A' in i.getbands():
            mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
            mask = 1. - torch.from_numpy(mask)
        else:
            mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
        
        return {
            "image": image,
            "mask": mask
        }

    @RPC.autoref
    @RPC.method
    def dump(image: torch.Tensor, format: str = "PNG") -> BytesIO:
        i = 255. * image.cpu().detach().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        buf = BytesIO()
        img.save(buf, format=format, compress_level=4)
        return buf
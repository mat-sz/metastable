from PIL import Image, ImageOps
import numpy as np
import torch
from io import BytesIO

from rpc import RPC

class ImageNamespace:
  @RPC.autoref
  @RPC.method("load")
  def load(data):
    i = Image.open(data)
    i = ImageOps.exif_transpose(i)
    image = i.convert("RGB")
    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]
    if 'A' in i.getbands():
        mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)
    else:
        mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
    return {
      "image": image,
      "mask": mask.unsqueeze(0)
    }

  @RPC.autoref
  @RPC.method("dump")
  def dump(image, format="PNG"):
    i = 255. * image.cpu().detach().numpy()
    img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
    buf = BytesIO()
    img.save(buf, format=format, compress_level=4)
    return buf

  @RPC.autoref
  @RPC.method("latent.empty")
  def empty(width, height, batch_size=1):
    return {"samples":torch.zeros([batch_size, 4, height // 8, width // 8])}
  
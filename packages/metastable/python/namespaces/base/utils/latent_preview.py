import torch
from PIL import Image
import numpy as np
from comfy.taesd.taesd import TAESD
import comfy.utils

MAX_PREVIEW_RESOLUTION = 512

class LatentPreviewer:
    def decode_latent_to_preview(self, x0):
        pass

class TAESDPreviewerImpl(LatentPreviewer):
    def __init__(self, taesd):
        self.taesd = taesd

    def decode_latent_to_preview(self, x0):
        x_sample = self.taesd.taesd_decoder(x0)[0].detach()
        # x_sample = self.taesd.unscale_latents(x_sample).div(4).add(0.5)  # returns value in [-2, 2]
        x_sample = x_sample.sub(0.5).mul(2)

        x_sample = torch.clamp((x_sample + 1.0) / 2.0, min=0.0, max=1.0)
        x_sample = 255. * np.moveaxis(x_sample.cpu().numpy(), 0, 2)
        x_sample = x_sample.astype(np.uint8)

        preview_image = Image.fromarray(x_sample)
        return preview_image


class Latent2RGBPreviewer(LatentPreviewer):
    def __init__(self, latent_rgb_factors):
        self.latent_rgb_factors = torch.tensor(latent_rgb_factors, device="cpu")

    def decode_latent_to_preview(self, x0):
        latent_image = x0[0].permute(1, 2, 0).cpu() @ self.latent_rgb_factors

        latents_ubyte = (((latent_image + 1) / 2)
                            .clamp(0, 1)  # change scale from -1..1 to 0..1
                            .mul(0xFF)  # to 0..255
                            .byte()).cpu()

        return Image.fromarray(latents_ubyte.numpy())


def get_previewer(device, method, latent_format, taesd_decoder_path):
    previewer = None
    if method is not None and method != "none":
        # TODO previewer methods

        if method == "auto":
            method = "latent2rgb"
            if taesd_decoder_path:
                method = "taesd"

        if method == "taesd":
            if taesd_decoder_path:
                taesd = TAESD(None, taesd_decoder_path).to(device)
                previewer = TAESDPreviewerImpl(taesd)
            else:
                print("Warning: TAESD previews enabled, but could not find models/vae_approx/{}".format(latent_format.taesd_decoder_name))

        if previewer is None:
            if latent_format.latent_rgb_factors is not None:
                previewer = Latent2RGBPreviewer(latent_format.latent_rgb_factors)
    return previewer

def prepare_callback(model, method, steps, x0_output_dict=None, taesd_decoder_path=None):
    previewer = get_previewer(model.load_device, method, model.model.latent_format, taesd_decoder_path)

    pbar = comfy.utils.ProgressBar(steps)
    def callback(step, x0, x, total_steps):
        if x0_output_dict is not None:
            x0_output_dict["x0"] = x0

        preview_bytes = None
        if previewer:
            preview_bytes = previewer.decode_latent_to_preview(x0)
        pbar.update_absolute(step + 1, total_steps, preview_bytes)
    return callback


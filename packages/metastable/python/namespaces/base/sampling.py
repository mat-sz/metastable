import comfy.samplers
import comfy.sample
import torch
import node_helpers
from .utils import custom, latent_preview

from rpc import RPC

def model_set_circular(model, is_circular=False):
    if isinstance(model, torch.nn.Conv2d):
        model.padding_mode = "circular" if is_circular else "zeros"

def get_callback(diffusion_model, steps, preview_config=None, x0_output=None):
    if preview_config is not None:
        taesd_decoder_path = None
        if preview_config["method"] == "taesd":
            taesd_decoder_name = diffusion_model.model.latent_format.taesd_decoder_name
            if "taesd" in preview_config and taesd_decoder_name in preview_config["taesd"]:
                taesd_decoder_path = preview_config["taesd"][taesd_decoder_name]

        return latent_preview.prepare_callback(
            model=diffusion_model, 
            method=preview_config["method"],
            steps=steps,
            x0_output_dict=x0_output,
            taesd_decoder_path=taesd_decoder_path,
        )
    else:
        return latent_preview.prepare_callback(
            model=diffusion_model,
            method="none",
            steps=steps,
            x0_output_dict=x0_output,
        )

class Noise_RandomNoise:
    def __init__(self, seed):
        self.seed = seed

    def generate_noise(self, input_latent):
        latent_image = input_latent["samples"]
        batch_inds = input_latent["batch_index"] if "batch_index" in input_latent else None
        return comfy.sample.prepare_noise(latent_image, self.seed, batch_inds)

class Guider_Basic(comfy.samplers.CFGGuider):
    def set_conds(self, positive):
        self.inner_set_conds({"positive": positive})

class SamplingNamespace:
    @RPC.autoref
    @RPC.method("get_sampler")
    def get_sampler(sampler_name):
        return comfy.samplers.sampler_object(sampler_name)
    
    @RPC.autoref
    @RPC.method("get_sigmas")
    def get_sigmas(diffusion_model, scheduler_name, steps, denoise = 1):
        total_steps = steps
        if denoise < 1.0:
            if denoise <= 0.0:
                return (torch.FloatTensor([]),)
            total_steps = int(steps/denoise)

        sigmas = comfy.samplers.calculate_sigmas(diffusion_model.get_model_object("model_sampling"), scheduler_name, total_steps).cpu()
        sigmas = sigmas[-(steps + 1):]
        return sigmas
    
    @RPC.autoref
    @RPC.method("flux_guidance")
    def flux_guidance(conditioning, guidance):
        return node_helpers.conditioning_set_values(conditioning, {"guidance": guidance})
    
    @RPC.autoref
    @RPC.method("basic_guider")
    def basic_guider(diffusion_model, conditioning):
        guider = Guider_Basic(diffusion_model)
        guider.set_conds(conditioning)
        return guider
    
    @RPC.autoref
    @RPC.method("sample")
    def sample(diffusion_model, latent, positive, negative, sampler_name, scheduler_name, steps, denoise, cfg, seed, is_circular=False, preview=None):
        model_set_circular(diffusion_model, is_circular)

        latent_image = comfy.sample.fix_empty_latent_channels(diffusion_model, latent["samples"])
        noise = comfy.sample.prepare_noise(latent_image, seed, None)

        noise_mask = None
        if "noise_mask" in latent:
            noise_mask = latent["noise_mask"]

        callback = get_callback(
            diffusion_model=diffusion_model,
            steps=steps,
            preview_config=preview,
        )
        sampler = comfy.samplers.sampler_object(sampler_name)

        custom_schedulers = custom.get_custom_schedulers()
        if scheduler_name not in custom_schedulers:
            return comfy.sample.sample(
                model=diffusion_model,
                noise=noise,
                steps=steps,
                cfg=cfg,
                sampler_name=sampler,
                scheduler=scheduler_name,
                positive=positive,
                negative=negative,
                latent_image=latent_image,
                noise_mask=noise_mask,
                callback=callback,
                disable_pbar=True,
                denoise=denoise,
                seed=seed
            )
        else:
            scheduler = custom_schedulers[scheduler_name]
            sigmas = scheduler(diffusion_model, steps, denoise)
            return comfy.sample.sample_custom(
                model=diffusion_model,
                noise=noise,
                cfg=cfg,
                sampler=sampler,
                sigmas=sigmas,
                positive=positive,
                negative=negative,
                latent_image=latent_image,
                noise_mask=noise_mask,
                callback=callback,
                disable_pbar=True,
                seed=seed
            )
    
    @RPC.autoref
    @RPC.method("random_noise")
    def random_noise(seed):
        return Noise_RandomNoise(seed)

    @RPC.autoref
    @RPC.method("sample_custom")
    def sample_custom(noise, guider, sampler, sigmas, latent, preview=None):
        latent["samples"] = comfy.sample.fix_empty_latent_channels(guider.model_patcher, latent["samples"])

        noise_mask = None
        if "noise_mask" in latent:
            noise_mask = latent["noise_mask"]

        x0_output = {}
        callback = get_callback(
            diffusion_model=guider.model_patcher,
            steps=sigmas.shape[-1] - 1,
            x0_output=x0_output,
            preview_config=preview,
        )

        samples = guider.sample(
            noise.generate_noise(latent),
            latent["samples"],
            sampler,
            sigmas,
            denoise_mask=noise_mask,
            callback=callback,
            disable_pbar=True,
            seed=noise.seed
        )
        samples = samples.to(comfy.model_management.intermediate_device())

        return samples
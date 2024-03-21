import comfy.sd
import comfy.sample
import comfy.samplers
import custom

from rpc import RPC

def get_sigmas(model, scheduler, steps, denoise, discard_penultimate_sigma=False):
    custom_schedulers = custom.get_custom_schedulers()
    if scheduler in custom_schedulers:
        scheduler = custom_schedulers[scheduler]
        return scheduler(model, steps, denoise)
    
    sigmas = comfy.samplers.calculate_sigmas_scheduler(model.model, scheduler, steps)

    if discard_penultimate_sigma:
        sigmas = torch.cat([sigmas[:-2], sigmas[-1:]])

    if denoise == 0 or denoise > 0.9999:
        return sigmas.cpu()
    else:
        new_steps = int(steps/denoise)
        sigmas = sigmas.cpu()
        return sigmas[-(steps + 1):]

def clip_encode(clip, text):
    tokens = clip.tokenize(text)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return [[cond, {"pooled_output": pooled}]]

class CheckpointNamespace:
  @RPC.autoref
  @RPC.method("load")
  def load(path, embeddings_path=None):
    (model, clip, vae, _) = comfy.sd.load_checkpoint_guess_config(path, output_vae=True, output_clip=True, embedding_directory=embeddings_path)
    return {
      "model": model,
      "clip": clip,
      "vae": vae
    }

  @RPC.autoref
  @RPC.method("clip.conditioning")
  def clip_conditioning(clip, positive, negative):
    return (clip_encode(clip, positive), clip_encode(clip, negative))

  @RPC.autoref
  @RPC.method("vae.decode")
  def vae_decode(vae, samples):
    decoded = vae.decode(samples)
    return [value for value in decoded]
  
  @RPC.autoref
  @RPC.method("sample")
  def sample(model, latent, conditioning, sampler_name, scheduler_name, steps, denoise, cfg, seed):
    latent_image = latent["samples"]
    positive, negative = conditioning
    noise = comfy.sample.prepare_noise(latent_image, seed, None)

    noise_mask = None
    if "noise_mask" in latent:
        noise_mask = latent["noise_mask"]

    callback = None

    discard_penultimate_sigma = False
    if sampler_name in ['dpm_2', 'dpm_2_ancestral', 'uni_pc', 'uni_pc_bh2']:
        steps += 1
        discard_penultimate_sigma = True
    
    sampler = comfy.samplers.sampler_object(sampler_name)
    sigmas = get_sigmas(model, scheduler_name, steps, denoise, discard_penultimate_sigma).cpu()

    return comfy.sample.sample_custom(model, noise, cfg, sampler, sigmas, positive, negative, latent_image, noise_mask=noise_mask, callback=callback, disable_pbar=True, seed=seed)
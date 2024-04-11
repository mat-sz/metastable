import torch

import comfy.sd
import comfy.sample
import comfy.samplers
import comfy.controlnet
import comfy.clip_vision
import comfy.utils
import comfy.model_management
import custom
import latent_preview

from rpc import RPC

last_checkpoint_path = None
last_checkpoint = None

def load_checkpoint(path, embeddings_path=None):
    return comfy.sd.load_checkpoint_guess_config(path, output_vae=True, output_clip=True, embedding_directory=embeddings_path)

def load_checkpoint_cached(path, embeddings_path=None):
    global last_checkpoint, last_checkpoint_path

    comfy.model_management.cleanup_models()

    if last_checkpoint != None and last_checkpoint_path == path:
        return last_checkpoint

    last_checkpoint = None
    comfy.model_management.cleanup_models()
    
    last_checkpoint_path = path
    last_checkpoint = load_checkpoint(path, embeddings_path)
    return last_checkpoint

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

def vae_encode_crop_pixels(pixels):
    x = (pixels.shape[1] // 8) * 8
    y = (pixels.shape[2] // 8) * 8
    if pixels.shape[1] != x or pixels.shape[2] != y:
        x_offset = (pixels.shape[1] % 8) // 2
        y_offset = (pixels.shape[2] % 8) // 2
        pixels = pixels[:, x_offset:x + x_offset, y_offset:y + y_offset, :]
    return pixels

def vae_encode(vae, pixels):
    pixels = vae_encode_crop_pixels(pixels)
    t = vae.encode(pixels[:,:,:,:3])
    return {"samples":t}

def vae_encode_inpaint(vae, pixels, mask, grow_mask_by=6):
    x = (pixels.shape[1] // 8) * 8
    y = (pixels.shape[2] // 8) * 8
    mask = torch.nn.functional.interpolate(mask.reshape((-1, 1, mask.shape[-2], mask.shape[-1])), size=(pixels.shape[1], pixels.shape[2]), mode="bilinear")

    pixels = pixels.clone()
    if pixels.shape[1] != x or pixels.shape[2] != y:
        x_offset = (pixels.shape[1] % 8) // 2
        y_offset = (pixels.shape[2] % 8) // 2
        pixels = pixels[:,x_offset:x + x_offset, y_offset:y + y_offset,:]
        mask = mask[:,:,x_offset:x + x_offset, y_offset:y + y_offset]

    #grow mask by a few pixels to keep things seamless in latent space
    if grow_mask_by == 0:
        mask_erosion = mask
    else:
        kernel_tensor = torch.ones((1, 1, grow_mask_by, grow_mask_by))
        padding = math.ceil((grow_mask_by - 1) / 2)

        mask_erosion = torch.clamp(torch.nn.functional.conv2d(mask.round(), kernel_tensor, padding=padding), 0, 1)

    m = (1.0 - mask.round()).squeeze(1)
    for i in range(3):
        pixels[:,:,:,i] -= 0.5
        pixels[:,:,:,i] *= m
        pixels[:,:,:,i] += 0.5
    t = vae.encode(pixels)

    return {"samples":t, "noise_mask": (mask_erosion[:,:,:x,:y].round())}


def model_set_circular(model, is_circular=False):
    if isinstance(model, torch.nn.Conv2d):
        model.padding_mode = "circular" if is_circular else "zeros"

class CheckpointNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path, embeddings_path=None, clip_layer=None):
        (model, clip, vae, _) = load_checkpoint_cached(path, embeddings_path)
        
        if clip_layer == None or clip_layer == 0:
            clip.clip_layer(None)
        else:
            clip.clip_layer(clip_layer)
        
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
    def vae_decode(vae, samples, is_circular=False):
        decoded = None
        if is_circular:
            decoded = vae_decode_circular(vae, samples)
        else:
            decoded = vae.decode(samples)
        
        return [value for value in decoded]

    @RPC.autoref
    @RPC.method("vae.encode")
    def vae_encode(vae, image, mask=None):
        if mask is not None:
            return vae_encode_inpaint(vae, image, mask)

        return vae_encode(vae, image)

    @RPC.autoref
    @RPC.method("lora.apply")
    def lora_apply(model, clip, path, strength):
        lora = comfy.utils.load_torch_file(settings["path"], safe_load=True)
        (model, clip) = comfy.sd.load_lora_for_models(model, clip, lora, strength, strength)
        return {
            "model": model,
            "clip": clip
        }

    @RPC.autoref
    @RPC.method("controlnet.apply")
    def controlnet_apply(conditioning, path, image, strength):
        controlnet = comfy.controlnet.load_controlnet(path)

        start_percent = 0.0
        end_percent = 1.0

        if strength == 0:
            return (positive, negative)

        control_hint = image.movedim(-1,1)
        cnets = {}

        out = []
        for cond in conditioning:
            c = []
            for t in cond:
                d = t[1].copy()

                prev_cnet = d.get('control', None)
                if prev_cnet in cnets:
                    c_net = cnets[prev_cnet]
                else:
                    c_net = controlnet.copy().set_cond_hint(control_hint, strength, (start_percent, end_percent))
                    c_net.set_previous_controlnet(prev_cnet)
                    cnets[prev_cnet] = c_net

                d['control'] = c_net
                d['control_apply_to_uncond'] = False
                n = [t[0], d]
                c.append(n)
            out.append(c)
        return (out[0], out[1])

    @RPC.autoref
    @RPC.method("ipadapter.apply")
    def ipadapter_apply(model, path, clip_vision_path, image, strength):
        ipadapter_model = ipadapter.load(path)
        clip_vision_model = comfy.clip_vision.load(clip_vision_path)
        model = ipadapter.apply(ipadapter_model, model, strength, clip_vision_model, image)

        return {
            "model": model
        }
    
    @RPC.autoref
    @RPC.method("sample")
    def sample(model, latent, conditioning, sampler_name, scheduler_name, steps, denoise, cfg, seed, is_circular=False, preview=None):
        model_set_circular(model, is_circular)

        latent_image = latent["samples"]
        positive, negative = conditioning
        noise = comfy.sample.prepare_noise(latent_image, seed, None)

        noise_mask = None
        if "noise_mask" in latent:
            noise_mask = latent["noise_mask"]

        callback = None
        if preview is not None:
            taesd_decoder_path = None
            if preview["method"] == LatentPreviewMethod.TAESD:
                taesd_decoder_name = model.model.latent_format.taesd_decoder_name
                if taesd in preview and taesd_decoder_name in preview["taesd"]:
                    taesd_decoder_path = preview["taesd"][taesd_decoder_name]

            callback = latent_preview.prepare_callback(model, preview["method"], steps)
        else:
            callback = latent_preview.prepare_callback(model, "none", steps)

        discard_penultimate_sigma = False
        if sampler_name in ['dpm_2', 'dpm_2_ancestral', 'uni_pc', 'uni_pc_bh2']:
            steps += 1
            discard_penultimate_sigma = True
        
        sampler = comfy.samplers.sampler_object(sampler_name)
        sigmas = get_sigmas(model, scheduler_name, steps, denoise, discard_penultimate_sigma).cpu()

        return comfy.sample.sample_custom(model, noise, cfg, sampler, sigmas, positive, negative, latent_image, noise_mask=noise_mask, callback=callback, disable_pbar=True, seed=seed)
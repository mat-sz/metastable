import os
import sys
import copy
import json
import time
import logging
import threading
import heapq
import traceback
import gc
from io import BytesIO
import base64
import math
from comfy.cli_args import LatentPreviewMethod

from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np
import safetensors.torch

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), "comfy"))

import torch

import comfy.diffusers_load
import comfy.samplers
import comfy.sample
import comfy.sd
import comfy.utils
import comfy.controlnet

import comfy.clip_vision

import comfy.model_management
from comfy_extras.chainner_models import model_loading
import custom

import latent_preview
from helpers import jsonout, get_save_image_counter

def load_image(img):
    i = Image.open(BytesIO(base64.b64decode(img)))
    i = ImageOps.exif_transpose(i)
    image = i.convert("RGB")
    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]
    if 'A' in i.getbands():
        mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)
    else:
        mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
    return (image, mask.unsqueeze(0))

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

def vae_decode_circular(vae, samples):
    for layer in [
        layer
        for layer in vae.first_stage_model.modules()
        if isinstance(layer, torch.nn.Conv2d)
    ]:
        layer.padding_mode = "circular"
    result = vae.decode(samples)
    for layer in [
        layer
        for layer in vae.first_stage_model.modules()
        if isinstance(layer, torch.nn.Conv2d)
    ]:
        layer.padding_mode = "zeros"
    return result

def model_make_circular(m):
    if isinstance(m, torch.nn.Conv2d):
        m.padding_mode = "circular"

def model_unmake_circular(m):
    if isinstance(m, torch.nn.Conv2d):
        m.padding_mode = "zeros"

def apply_controlnet(conditioning, settings):
    strength, controlnet_path, image_data = settings["strength"], settings["path"], settings["image"]

    (image, mask) = load_image(image_data)
    controlnet = load_controlnet(controlnet_path)

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

def clip_encode(clip, text):
    tokens = clip.tokenize(text)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return [[cond, {"pooled_output": pooled}]]

def empty_latent_image(settings):
    batch_size, height, width = settings["batch_size"], settings["height"], settings["width"]
    return {"samples":torch.zeros([batch_size, 4, height // 8, width // 8])}

def create_conditioning(clip, settings):
    return (clip_encode(clip, settings["positive"]), clip_encode(clip, settings["negative"]))

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

def ksampler(model, latent, conditioning, settings):
    latent_image = latent["samples"]
    positive, negative = conditioning
    seed = settings["seed"]
    noise = comfy.sample.prepare_noise(latent_image, seed, None)

    noise_mask = None
    if "noise_mask" in latent:
        noise_mask = latent["noise_mask"]

    steps, denoise, cfg = settings["steps"], settings["denoise"], settings["cfg"]

    callback = None
    if "preview" in settings:
        taesd_decoder_path = None
        if settings["preview"]["method"] == LatentPreviewMethod.TAESD:
            taesd_decoder_name = model.model.latent_format.taesd_decoder_name
            if taesd in settings["preview"] and taesd_decoder_name in settings["preview"]["taesd"]:
                taesd_decoder_path = settings["preview"]["taesd"][taesd_decoder_name]

        callback = latent_preview.prepare_callback(model, settings["preview"]["method"], steps)
    else:
        callback = latent_preview.prepare_callback(model, "none", steps)

    discard_penultimate_sigma = False
    if settings["sampler"] in ['dpm_2', 'dpm_2_ancestral', 'uni_pc', 'uni_pc_bh2']:
        steps += 1
        discard_penultimate_sigma = True
    
    sampler = comfy.samplers.sampler_object(settings["sampler"])
    sigmas = get_sigmas(model, settings["scheduler"], steps, denoise, discard_penultimate_sigma).cpu()

    return comfy.sample.sample_custom(model, noise, cfg, sampler, sigmas, positive, negative, latent_image, noise_mask=noise_mask, callback=callback, disable_pbar=True, seed=seed)

def load_checkpoint(settings):
    embedding_directory = None

    if "embeddings_path" in settings:
        embedding_directory = settings["embeddings_path"]
    
    return comfy.sd.load_checkpoint_guess_config(settings["path"], output_vae=True, output_clip=True, embedding_directory=embedding_directory)

def load_lora(model, clip, settings):
    lora = comfy.utils.load_torch_file(settings["path"], safe_load=True)

    strength = settings["strength"]
    return comfy.sd.load_lora_for_models(model, clip, lora, strength, strength)

def load_controlnet(controlnet_path):
    controlnet = comfy.controlnet.load_controlnet(controlnet_path)
    return controlnet

def save_images(settings, images):
    output_dir = settings["output_path"]
    settings = sanitize_prompt(settings)
    counter = get_save_image_counter(output_dir)

    output_filenames = []

    for image in images:
        i = 255. * image.cpu().detach().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        metadata = PngInfo()
        if settings is not None:
            metadata.add_text("metastable_settings", json.dumps(settings))
        
        file = f"{counter:05}.png"
        img.save(os.path.join(output_dir, file), pnginfo=metadata, compress_level=4)
        output_filenames.append(file)
        counter += 1

    return output_filenames

def load_upscale_model(settings):
    model_path = settings["path"]
    sd = comfy.utils.load_torch_file(model_path, safe_load=True)
    if "module.layers.0.residual_group.blocks.0.norm1.weight" in sd:
        sd = comfy.utils.state_dict_prefix_replace(sd, {"module.":""})
    return model_loading.load_state_dict(sd).eval()

def image_upscale(upscale_model, image):
    device = comfy.model_management.get_torch_device()
    upscale_model.to(device)
    in_img = image.movedim(-1,-3).to(device)
    free_memory = comfy.model_management.get_free_memory(device)

    tile = 512
    overlap = 32

    oom = True
    while oom:
        try:
            steps = in_img.shape[0] * comfy.utils.get_tiled_scale_steps(in_img.shape[3], in_img.shape[2], tile_x=tile, tile_y=tile, overlap=overlap)
            pbar = comfy.utils.ProgressBar(steps)
            s = comfy.utils.tiled_scale(in_img, lambda a: upscale_model(a), tile_x=tile, tile_y=tile, overlap=overlap, upscale_amount=upscale_model.scale, pbar=pbar)
            oom = False
        except comfy.model_management.OOM_EXCEPTION as e:
            tile //= 2
            if tile < 128:
                raise e

    upscale_model.cpu()
    s = torch.clamp(s.movedim(-3,-1), min=0, max=1.0)
    return s

last_checkpoint_path = None
last_checkpoint = None

def load_checkpoint_cached(path):
    global last_checkpoint, last_checkpoint_path

    if last_checkpoint != None and last_checkpoint_path == path:
        return last_checkpoint
    
    last_checkpoint_path = path
    last_checkpoint = load_checkpoint(path)
    return last_checkpoint

def sanitize_prompt(settings):
    settings = copy.deepcopy(settings)

    del settings["id"]
    del settings["project_id"]
    models_settings = settings["models"]

    del models_settings["base"]["path"]
    if "embeddings_path" in models_settings["base"]:
        del models_settings["base"]["embeddings_path"]

    if "loras" in models_settings:
        for lora_settings in models_settings["loras"]:
            del lora_settings["path"]

    if "controlnets" in models_settings:
        for controlnet_settings in models_settings["controlnets"]:
            del controlnet_settings["path"]
            del controlnet_settings["image"]
    
    if "upscale" in models_settings:
        del models_settings["upscale"]["path"]

    if "image" in settings["input"]:
        del settings["input"]["image"]

    del settings["output_path"]

    return settings

def execute_prompt(prompt):
    models_settings = prompt["models"]
    (model, clip, vae, _) = load_checkpoint_cached(models_settings["base"])
    tiling = prompt["sampler"]["tiling"]

    if "loras" in models_settings:
        for lora_settings in models_settings["loras"]:
            (model, clip) = load_lora(model, clip, lora_settings)

    if tiling:
        model.model.apply(model_make_circular)
    else:
        model.model.apply(model_unmake_circular)

    conditioning = create_conditioning(clip, prompt["conditioning"])
    latent = None

    if "controlnets" in models_settings:
        for controlnet_settings in models_settings["controlnets"]:
            conditioning = apply_controlnet(conditioning, controlnet_settings)

    input_mode = prompt["input"]["mode"]
    if input_mode == "empty":
        latent = empty_latent_image(prompt["input"])
    elif input_mode == "image":
        (image, mask) = load_image(prompt["input"]["image"])
        latent = vae_encode(vae, image)
    elif input_mode == "image_masked":
        (image, mask) = load_image(prompt["input"]["image"])
        latent = vae_encode_inpaint(vae, image, mask)

    samples = ksampler(model, latent, conditioning, prompt["sampler"])
    images = None

    if tiling:
        images = vae_decode_circular(vae, samples)
    else:
        images = vae.decode(samples)

    if "upscale" in models_settings:
        upscale_model = load_upscale_model(models_settings["upscale"])
        images = image_upscale(upscale_model, images)

    return save_images(prompt, images)

class PromptExecutor:
    def __init__(self):
        self.outputs = {}
        self.object_storage = {}
        self.outputs_ui = {}
        self.old_prompt = {}

        # Next, remove the subsequent outputs since they will not be executed
        to_delete = []
        for o in self.outputs:
            if (o not in current_outputs) and (o not in executed):
                to_delete += [o]
                if o in self.old_prompt:
                    d = self.old_prompt.pop(o)
                    del d
        for o in to_delete:
            d = self.outputs.pop(o)
            del d

    def execute(self, prompt, extra_data={}):
        project_id, prompt_id = prompt["project_id"], prompt["id"]

        execution_start_time = time.perf_counter()
        jsonout("prompt.start", {
            "id": prompt_id,
            "project_id": project_id
        })

        try:
            output_filenames = []
            with torch.inference_mode():
                output_filenames = execute_prompt(prompt)
            
            jsonout("prompt.end", {
                "id": prompt_id,
                "project_id": project_id,
                "output_filenames": output_filenames,
                "time": (time.perf_counter() - execution_start_time) * 1000
            })
        except Exception as error:
            jsonout("prompt.error", {
                "id": prompt_id,
                "project_id": project_id,
                "name": type(error).__name__,
                "description": str(error)
            })
            traceback.print_exc()

class PromptQueue:
    def __init__(self):
        self.mutex = threading.RLock()
        self.not_empty = threading.Condition(self.mutex)
        self.task_counter = 0
        self.queue = []
        self.currently_running = {}

    def put(self, item):
        with self.mutex:
            heapq.heappush(self.queue, item)
            self.queue_updated()
            self.not_empty.notify()

    def get(self):
        with self.not_empty:
            while len(self.queue) == 0:
                self.not_empty.wait()
            item = heapq.heappop(self.queue)
            i = self.task_counter
            self.currently_running[i] = copy.deepcopy(item)
            self.task_counter += 1
            self.queue_updated()
            return (item, i)

    def task_done(self, item_id, outputs):
        with self.mutex:
            prompt = self.currently_running.pop(item_id)
            self.queue_updated()

    def get_current_queue(self):
        with self.mutex:
            out = []
            for x in self.currently_running.values():
                out += [x]
            return (out, copy.deepcopy(self.queue))

    def get_tasks_remaining(self):
        with self.mutex:
            return len(self.queue) + len(self.currently_running)

    def wipe_queue(self):
        with self.mutex:
            self.queue = []
            self.queue_updated()

    def delete_queue_item(self, function):
        with self.mutex:
            for x in range(len(self.queue)):
                if function(self.queue[x]):
                    if len(self.queue) == 1:
                        self.wipe_queue()
                    else:
                        self.queue.pop(x)
                        heapq.heapify(self.queue)
                        self.queue_updated()
                    return True
        return False

    def queue_updated(self):
        jsonout("prompt.queue", self.queue_info())

    def queue_info(self):
        return {
            "queue_remaining": self.get_tasks_remaining()
        }
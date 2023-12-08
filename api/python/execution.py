import os
import sys
import copy
import json
import logging
import threading
import heapq
import traceback
import gc
from io import BytesIO
import base64
import math

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

import folder_paths
import latent_preview
from jsonout import jsonout

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

def clip_encode(clip, text):
    tokens = clip.tokenize(text)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return [[cond, {"pooled_output": pooled}]]

def empty_latent_image(settings):
    batch_size, height, width = settings["batch_size"], settings["height"], settings["width"]
    return {"samples":torch.zeros([batch_size, 4, height // 8, width // 8])}

def create_conditioning(clip, settings):
    return (clip_encode(clip, settings["positive"]), clip_encode(clip, settings["negative"]))

def ksampler(model, latent, conditioning, settings):
    latent_image = latent["samples"]
    positive, negative = conditioning
    seed = settings["seed"]
    noise = comfy.sample.prepare_noise(latent_image, seed, None)

    noise_mask = None
    if "noise_mask" in latent:
        noise_mask = latent["noise_mask"]

    steps = settings["steps"]
    callback = latent_preview.prepare_callback(model, steps)

    denoise, cfg, sampler, scheduler = settings["denoise"], settings["cfg"], settings["sampler"], settings["scheduler"]
    return comfy.sample.sample(model, noise, steps, cfg, sampler, scheduler, positive, negative, latent_image,
                                                                denoise=denoise, disable_noise=False, start_step=None, last_step=None,
                                                                force_full_denoise=False, noise_mask=noise_mask, callback=callback, disable_pbar=True, seed=seed)

def load_checkpoint(settings):
    ckpt_path = folder_paths.get_full_path("checkpoints", settings["name"])
    return comfy.sd.load_checkpoint_guess_config(ckpt_path, output_vae=True, output_clip=True, embedding_directory=None)
    

def load_lora(model, clip, settings):
    lora_path = folder_paths.get_full_path("loras", settings["name"])
    lora = comfy.utils.load_torch_file(lora_path, safe_load=True)

    strength = settings["strength"]
    return comfy.sd.load_lora_for_models(model, clip, lora, strength, strength)

def save_images(prompt, images):
    project_id = prompt["project_id"]
    folder_paths.create_project_tree(project_id)
    output_dir = folder_paths.get_output_directory(project_id)
    counter = folder_paths.get_save_image_counter(output_dir)

    output_filenames = []

    for image in images:
        i = 255. * image.cpu().detach().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        metadata = PngInfo()
        if prompt is not None:
            metadata.add_text("prompt", json.dumps(prompt))
        
        file = f"{counter:05}.png"
        img.save(os.path.join(output_dir, file), pnginfo=metadata, compress_level=4)
        output_filenames.append(file)
        counter += 1

    return output_filenames

def execute_prompt(prompt, prompt_id):
    models_settings = prompt["models"]
    (model, clip, vae, _) = load_checkpoint(models_settings["base"])

    for lora_settings in models_settings["loras"]:
        (model, clip) = load_lora(model, clip, lora_settings)

    conditioning = create_conditioning(clip, prompt["conditioning"])
    latent = None

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
    images = vae.decode(samples)
    output_filenames = save_images(prompt, images)
    
    jsonout("prompt.end", { "prompt_id": prompt_id, "output_filenames": output_filenames, "project_id": prompt["project_id"] })

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

    def execute(self, prompt, prompt_id, extra_data={}):
        jsonout("prompt.start", { "prompt_id": prompt_id })

        with torch.inference_mode():
            execute_prompt(prompt, prompt_id)
                        

class PromptQueue:
    def __init__(self):
        self.mutex = threading.RLock()
        self.not_empty = threading.Condition(self.mutex)
        self.task_counter = 0
        self.queue = []
        self.currently_running = {}
        self.history = {}

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
            self.history[prompt[0]] = { "prompt": prompt, "outputs": {} }
            for o in outputs:
                self.history[prompt[0]]["outputs"][o] = outputs[o]
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

    def get_history(self, prompt_id=None):
        with self.mutex:
            if prompt_id is None:
                return copy.deepcopy(self.history)
            elif prompt_id in self.history:
                return {prompt_id: copy.deepcopy(self.history[prompt_id])}
            else:
                return {}

    def wipe_history(self):
        with self.mutex:
            self.history = {}

    def delete_history_item(self, id_to_delete):
        with self.mutex:
            self.history.pop(id_to_delete, None)

    def queue_updated(self):
        jsonout("prompt.queue", self.queue_info())

    def queue_info(self):
        return {
            "queue_remaining": self.get_tasks_remaining()
        }
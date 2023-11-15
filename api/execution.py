import os
import sys
import copy
import json
import logging
import threading
import heapq
import traceback
import gc

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

def clip_encode(clip, text):
    tokens = clip.tokenize(text)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return [[cond, {"pooled_output": pooled}]]

def empty_latent_image(settings):
    batch_size, height, width = settings["batch_size"], settings["height"], settings["width"]
    return torch.zeros([batch_size, 4, height // 8, width // 8])

def create_conditioning(clip, settings):
    return (clip_encode(clip, settings["positive"]), clip_encode(clip, settings["negative"]))

def ksampler(model, latent, conditioning, settings):
    positive, negative = conditioning
    seed = settings["seed"]
    noise = comfy.sample.prepare_noise(latent, seed, None)

    disable_pbar = not comfy.utils.PROGRESS_BAR_ENABLED
    steps = settings["steps"]
    callback = latent_preview.prepare_callback(model, steps)

    denoise, cfg, sampler, scheduler = settings["denoise"], settings["cfg"], settings["sampler"], settings["scheduler"]
    return comfy.sample.sample(model, noise, steps, cfg, sampler, scheduler, positive, negative, latent,
                                                                denoise=denoise, disable_noise=False, start_step=None, last_step=None,
                                                                force_full_denoise=False, noise_mask=None, callback=callback, disable_pbar=disable_pbar, seed=seed)

def load_checkpoint(settings):
    ckpt_path = folder_paths.get_full_path("checkpoints", settings["name"])
    return comfy.sd.load_checkpoint_guess_config(ckpt_path, output_vae=True, output_clip=True, embedding_directory=None)
    

def load_lora(model, clip, settings):
    lora_path = folder_paths.get_full_path("loras", settings["name"])
    lora = comfy.utils.load_torch_file(lora_path, safe_load=True)

    strength = settings["strength"]
    return comfy.sd.load_lora_for_models(model, clip, lora, strength, strength)

def txt2img(server, prompt, prompt_id):
    models_settings = prompt["models"]
    (model, clip, vae, _) = load_checkpoint(models_settings["base"])

    for lora_settings in models_settings["loras"]:
        (model, clip) = load_lora(model, clip, lora_settings)

    conditioning = create_conditioning(clip, prompt["conditioning"])
    latent = empty_latent_image(prompt["input"])
    samples = ksampler(model, latent, conditioning, prompt["sampler"])
    images = vae.decode(samples)

    project_id = prompt["project_id"]
    folder_paths.create_project_tree(project_id)
    output_dir = folder_paths.get_output_directory(project_id)
    full_output_folder, filename, counter, subfolder, filename_prefix = folder_paths.get_save_image_path("testui", output_dir, images[0].shape[1], images[0].shape[0])

    output_filenames = []

    for image in images:
        i = 255. * image.cpu().detach().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        metadata = PngInfo()
        if prompt is not None:
            metadata.add_text("prompt", json.dumps(prompt))
        
        file = f"{filename}_{counter:05}_.png"
        img.save(os.path.join(full_output_folder, file), pnginfo=metadata, compress_level=4)
        output_filenames.append(file)
        counter += 1

    server.send_sync("prompt.end", { "prompt_id": prompt_id, "output_filenames": output_filenames, "project_id": project_id }, server.client_id)

class PromptExecutor:
    def __init__(self, server):
        self.outputs = {}
        self.object_storage = {}
        self.outputs_ui = {}
        self.old_prompt = {}
        self.server = server

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
        if "client_id" in extra_data:
            self.server.client_id = extra_data["client_id"]
        else:
            self.server.client_id = None

        if self.server.client_id is not None:
            self.server.send_sync("prompt.start", { "prompt_id": prompt_id }, self.server.client_id)

        with torch.inference_mode():
            txt2img(self.server, prompt, prompt_id)
                        

class PromptQueue:
    def __init__(self, server):
        self.server = server
        self.mutex = threading.RLock()
        self.not_empty = threading.Condition(self.mutex)
        self.task_counter = 0
        self.queue = []
        self.currently_running = {}
        self.history = {}
        server.prompt_queue = self

    def put(self, item):
        with self.mutex:
            heapq.heappush(self.queue, item)
            self.server.prompt_queue_updated()
            self.not_empty.notify()

    def get(self):
        with self.not_empty:
            while len(self.queue) == 0:
                self.not_empty.wait()
            item = heapq.heappop(self.queue)
            i = self.task_counter
            self.currently_running[i] = copy.deepcopy(item)
            self.task_counter += 1
            self.server.prompt_queue_updated()
            return (item, i)

    def task_done(self, item_id, outputs):
        with self.mutex:
            prompt = self.currently_running.pop(item_id)
            self.history[prompt[0]] = { "prompt": prompt, "outputs": {} }
            for o in outputs:
                self.history[prompt[0]]["outputs"][o] = outputs[o]
            self.server.prompt_queue_updated()

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
            self.server.prompt_queue_updated()

    def delete_queue_item(self, function):
        with self.mutex:
            for x in range(len(self.queue)):
                if function(self.queue[x]):
                    if len(self.queue) == 1:
                        self.wipe_queue()
                    else:
                        self.queue.pop(x)
                        heapq.heapify(self.queue)
                    self.server.prompt_queue_updated()
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

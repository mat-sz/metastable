import { ChildProcessWithoutNullStreams } from 'child_process';
import EventEmitter from 'events';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid/non-secure';
import { ComfyLogItem, ComfyTorchInfo, ComfyStatus } from '@metastable/types';
import { exists } from '@metastable/fs-helpers';
import type { Storage } from '@metastable/storage';

import { CircularBuffer } from './helpers.js';
import type { PythonInstance } from './python.js';

const baseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export class Comfy extends EventEmitter {
  process?: ChildProcessWithoutNullStreams;

  samplers: string[] = [];
  schedulers: string[] = [];
  torchInfo?: ComfyTorchInfo = undefined;
  logBuffer = new CircularBuffer<ComfyLogItem>(25);

  status: ComfyStatus = 'starting';
  queue_remaining = 0;

  constructor(
    public python: PythonInstance,
    private mainPath = path.join(baseDir, 'python', 'main.py'),
  ) {
    super();

    this.on('event', e => {
      switch (e.event) {
        case 'info.torch':
          this.torchInfo = e.data;
          break;
        case 'info.samplers':
          this.samplers = e.data;
          break;
        case 'info.schedulers':
          this.schedulers = e.data;
          break;
        case 'ready':
          this.setStatus('ready');
          break;
        case 'prompt.queue':
          this.queue_remaining = e.data.queue_remaining;
          break;
      }
    });

    this.start();
  }

  async start() {
    if (this.process?.connected) {
      return;
    }

    const args: string[] = [];

    if (os.arch() === 'arm64' && os.platform() === 'darwin') {
      // We're running on an M1 Mac.
      args.push('--force-fp16');
    }

    const proc = this.python.spawn([this.mainPath, ...args]);

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');
    proc.on('spawn', () => this.setStatus('starting'));
    proc.on('close', () => this.setStatus('error'));
    proc.on('exit', () => this.setStatus('error'));

    proc.stdout.on('data', data => {
      const split = data.split('\n');
      for (const item of split) {
        if (!item) {
          continue;
        }

        try {
          this.emit('event', JSON.parse(item));
        } catch {
          this.log('stdout', item);
        }
      }
    });

    proc.stderr.on('data', data => {
      this.log('stderr', data);
    });

    this.process = proc;
  }

  stop(force = false) {
    this.process?.kill(force ? 'SIGKILL' : 'SIGTERM');
  }

  private log(type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    this.logBuffer.push(item);
    this.emit('event', {
      event: 'backend.log',
      data: item,
    });
  }

  reset() {
    this.queue_remaining = 0;
    this.torchInfo = undefined;
    this.emit('reset');
  }

  setStatus(status: ComfyStatus) {
    this.status = status;
    if (status !== 'ready') {
      this.reset();
    }

    this.emit('event', { event: 'backend.status', data: status });
  }

  send(eventName: string, data: any) {
    this.process?.stdin.write(
      JSON.stringify({ event: eventName, data }) + '\n',
    );
  }

  async prompt(settings: any, storage: Storage) {
    settings.models.base.path = storage.models.path(
      'checkpoints',
      settings.models.base.name,
    );

    const embeddingsDir = storage.models.dir('embeddings');
    if (await exists(embeddingsDir)) {
      settings.models.base.embedding_directory = embeddingsDir;
    }

    if (settings.models.loras) {
      for (const lora of settings.models.loras) {
        lora.path = storage.models.path('loras', lora.name);
      }
    }

    if (settings.models.controlnets) {
      for (const controlnet of settings.models.controlnets) {
        controlnet.path = storage.models.path('controlnet', controlnet.name);
      }
    }

    if (settings.models.upscale) {
      settings.models.upscale.path = storage.models.path(
        'upscale_models',
        settings.models.upscale.name,
      );
    }

    if (settings.sampler.preview?.method === 'taesd') {
      const list = await storage.models.type('vae_approx');
      settings.sampler.preview.taesd = {
        taesd_decoder: await storage.models.find(list, 'taesd_decoder'),
        taesdxl_decoder: await storage.models.find(list, 'taesdxl_decoder'),
      };
    }

    settings.sampler.tiling = !!settings.sampler.tiling;

    const id = nanoid();

    this.send('prompt', {
      ...settings,
      id: id,
      output_path: storage.projects.path(settings.project_id, 'output'),
    });

    return { id };
  }
}

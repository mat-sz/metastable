import EventEmitter from 'events';
import path from 'path';
import { nanoid } from 'nanoid/non-secure';
import { Storage } from '@metastable/storage';
import { Comfy } from '@metastable/comfy';
import { PythonInstance } from '@metastable/python';
import { Downloader } from '@metastable/downloader';
import { exists, isPathIn } from '@metastable/fs-helpers';

export class Metastable extends EventEmitter {
  storage;
  downloader = new Downloader();
  python?: PythonInstance;
  comfy?: Comfy;

  onEvent = (event: any) => {
    console.log(`[${new Date().toISOString()}]`, event);
    this.emit('event', event);
  };

  constructor(
    dataRoot: string,
    private settings: { comfyMainPath?: string } = {},
  ) {
    super();
    this.storage = new Storage(dataRoot);
    this.downloader.on('event', this.onEvent);
  }

  async init() {
    await this.storage.init();
    await this.restartComfy();
  }

  async restartComfy() {
    this.comfy?.removeAllListeners();
    this.comfy?.stop(true);

    const config = await this.storage.config.all();
    this.python =
      config.python.mode === 'system' || !config.python.executablePath
        ? await PythonInstance.fromSystem(path.resolve('../comfy/python/.pip'))
        : await PythonInstance.fromDirectory(config.python.executablePath);
    this.comfy = new Comfy(this.python, this.settings.comfyMainPath);

    const comfy = this.comfy;
    comfy.on('event', this.onEvent);

    comfy.on('reset', () => {
      this.onEvent({
        event: 'prompt.queue',
        data: {
          queue_remaining: comfy.queue_remaining,
        },
      });
    });
  }

  replayEvents(onEvent: (event: any) => void) {
    const comfy = this.comfy;

    if (comfy) {
      onEvent({
        event: 'prompt.queue',
        data: {
          queue_remaining: comfy.queue_remaining,
        },
      });
      onEvent({
        event: 'backend.status',
        data: comfy.status,
      });
      onEvent({
        event: 'backend.logBuffer',
        data: comfy.logBuffer.items,
      });

      if (comfy.torchInfo) {
        onEvent({
          event: 'info.torch',
          data: comfy.torchInfo,
        });
      }
    }
  }

  async prompt(settings: any) {
    if (this.comfy?.status !== 'ready') {
      return undefined;
    }

    settings.models.base.path = this.storage.models.path(
      'checkpoints',
      settings.models.base.name,
    );

    const embeddingsDir = this.storage.models.dir('embeddings');
    if (await exists(embeddingsDir)) {
      settings.models.base.embedding_directory = embeddingsDir;
    }

    if (settings.models.loras) {
      for (const lora of settings.models.loras) {
        lora.path = this.storage.models.path('loras', lora.name);
      }
    }

    if (settings.models.controlnets) {
      for (const controlnet of settings.models.controlnets) {
        controlnet.path = this.storage.models.path(
          'controlnet',
          controlnet.name,
        );
      }
    }

    if (settings.models.upscale) {
      settings.models.upscale.path = this.storage.models.path(
        'upscale_models',
        settings.models.upscale.name,
      );
    }

    if (settings.sampler.preview?.method === 'taesd') {
      const list = await this.storage.models.type('vae_approx');
      settings.sampler.preview.taesd = {
        taesd_decoder: await this.storage.models.find(list, 'taesd_decoder'),
        taesdxl_decoder: await this.storage.models.find(
          list,
          'taesdxl_decoder',
        ),
      };
    }

    settings.sampler.tiling = !!settings.sampler.tiling;

    const id = nanoid();

    this.comfy?.send('prompt', {
      ...settings,
      id: id,
      output_path: this.storage.projects.path(settings.project_id, 'output'),
    });

    return { id };
  }

  async downloadModel(data: { name: string; type: string; url: string }) {
    const savePath = this.storage.models.path(data.type, data.name);
    if (!isPathIn(this.storage.modelsDir, savePath)) {
      throw new Error(
        'Attempted to save file outside of the parent directory.',
      );
    }

    const url = new URL(data.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Only HTTP(S) URLs are supported.');
    }

    return await this.downloader.add(data.url, savePath);
  }

  async info() {
    return {
      samplers: this.comfy?.samplers || [],
      schedulers: this.comfy?.schedulers || [],
      models: await this.storage.models.all(),
    };
  }
}

import EventEmitter from 'events';
import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import { nanoid } from 'nanoid/non-secure';
import { Storage } from '@metastable/storage';
import { Comfy } from '@metastable/comfy';
import { PythonInstance } from '@metastable/python';
import { Downloader } from '@metastable/downloader';
import { exists, isPathIn } from '@metastable/fs-helpers';
import { AnyEvent, Project, ProjectSettings } from '@metastable/types';

import { Setup } from './setup.js';

export class Metastable extends EventEmitter {
  storage;
  downloader = new Downloader();
  python?: PythonInstance;
  comfy?: Comfy;
  settingsCache: Record<Project['id'], string> = {};
  setup = new Setup(this);

  onEvent = async (event: AnyEvent) => {
    console.log(`[${new Date().toISOString()}]`, event);
    this.emit('event', event);

    if (event.event === 'prompt.end') {
      const settings = this.settingsCache[event.data.id];
      for (const filename of event.data.output_filenames) {
        const settingsPath = this.storage.projects.path(
          event.data.project_id,
          'output',
          `${filename}.json`,
        );
        await fs.writeFile(settingsPath, settings);
      }
      delete this.settingsCache[event.data.id];
    } else if (event.event === 'prompt.error') {
      delete this.settingsCache[event.data.id];
    }
  };

  constructor(
    dataRoot: string,
    private settings: { comfyMainPath?: string } = {},
  ) {
    super();
    this.storage = new Storage(dataRoot);
    this.downloader.on('event', this.onEvent);

    let timeout: any = undefined;
    chokidar.watch(this.storage.modelsDir, {}).on('all', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.onEvent({
          event: 'models.changed',
        });
      }, 250);
    });
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

  async prompt(projectId: Project['id'], settings: ProjectSettings) {
    if (this.comfy?.status !== 'ready') {
      return undefined;
    }

    const id = nanoid();
    this.settingsCache[id] = JSON.stringify(settings);

    settings.models.base.path = this.storage.models.path(
      'checkpoints',
      settings.models.base.name,
    );

    const embeddingsDir = this.storage.models.dir('embeddings');
    if (await exists(embeddingsDir)) {
      settings.models.base.embeddings_path = embeddingsDir;
    }

    if (settings.models.loras) {
      settings.models.loras = settings.models.loras
        .filter(model => model.enabled && model.name)
        .map(model => ({
          ...model,
          path: this.storage.models.path('loras', model.name!),
        }));
    }

    if (settings.models.controlnets) {
      settings.models.controlnets = settings.models.controlnets
        .filter(model => model.enabled && model.name)
        .map(model => ({
          ...model,
          path: this.storage.models.path('controlnet', model.name!),
        }));
    }

    if (settings.models.upscale?.name && settings.models.upscale?.enabled) {
      settings.models.upscale.path = this.storage.models.path(
        'upscale_models',
        settings.models.upscale.name,
      );
    } else {
      settings.models.upscale = undefined;
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

    this.comfy?.send('prompt', {
      ...settings,
      id: id,
      project_id: projectId,
      output_path: this.storage.projects.path(projectId, 'output'),
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

import EventEmitter from 'events';
import path from 'path';
import { nanoid } from 'nanoid/non-secure';
import si from 'systeminformation';
import checkDiskSpace from 'check-disk-space';
import {
  AnyEvent,
  LogItem,
  DownloadSettings,
  ModelType,
  Project,
  ProjectSettings,
  ProjectTrainingSettings,
  Utilization,
} from '@metastable/types';
import chokidar from 'chokidar';

import { Setup } from './setup/index.js';
import { Comfy } from './comfy/index.js';
import { PythonInstance } from './python/index.js';
import { Storage } from './storage/index.js';
import { exists, isPathIn, resolveConfigPath } from './helpers/fs.js';
import { DownloadModelTask } from './downloader/index.js';
import { Tasks } from './tasks/index.js';
import { Kohya } from './kohya/index.js';
import { ProjectEntity } from './data/project.js';
import { EntityRepository } from './data/common.js';
import { TypedEventEmitter } from './types.js';

type MetastableEvents = {
  event: (event: AnyEvent) => void;
  utilization: (data: Utilization) => void;
  backendLog: (data: LogItem[]) => void;
};

export class Metastable extends (EventEmitter as {
  new (): TypedEventEmitter<MetastableEvents>;
}) {
  storage;
  python?: PythonInstance;
  comfy?: Comfy;
  settingsCache: Record<Project['id'], any> = {};
  setup = new Setup(this);
  tasks = new Tasks();
  kohya?: Kohya;
  project;

  onEvent = async (event: AnyEvent) => {
    console.log(`[${new Date().toISOString()}]`, event);

    if (event.event === 'prompt.end') {
      const settings = this.settingsCache[event.data.id];
      try {
        const project = await this.project.get(event.data.project_id);
        for (const filename of event.data.output_filenames) {
          const output = await project.output.get(filename);
          await output.metadata.set(settings);
        }
      } catch {}
      delete this.settingsCache[event.data.id];
    } else if (event.event === 'prompt.error') {
      delete this.settingsCache[event.data.id];
    }
    this.emit('event', event);
  };

  constructor(
    private dataRoot: string,
    private settings: {
      comfyMainPath?: string;
      skipPythonSetup?: boolean;
    } = {},
  ) {
    super();
    this.setup.skipPythonSetup = !!settings.skipPythonSetup;
    this.storage = new Storage(dataRoot);
    this.project = new EntityRepository(
      path.join(this.dataRoot, 'projects'),
      ProjectEntity,
    );
    this.setup.on('event', this.onEvent);
    this.tasks.on('event', this.onEvent);

    let timeout: any = undefined;
    chokidar.watch(this.storage.modelsDir, {}).on('all', (event: string) => {
      if (event !== 'add' && event !== 'unlink') {
        return;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.onEvent({
          event: 'models.changed',
        });
      }, 250);
    });

    setInterval(async () => {
      // @ts-ignore
      const [graphics, cpuTemperature, currentLoad, mem, usage] =
        await Promise.all([
          si.graphics(),
          si.cpuTemperature(),
          si.currentLoad(),
          si.mem(),
          (checkDiskSpace as any)(this.dataRoot),
        ]);

      const gpu = graphics.controllers[0];
      this.emit('utilization', {
        cpuUsage: currentLoad.currentLoad,
        hddTotal: usage.size,
        hddUsed: usage.size - usage.free,
        ramTotal: mem.total,
        ramUsed: mem.used,
        cpuTemperature: cpuTemperature.main,
        gpuTemperature: gpu?.temperatureGpu,
        gpuUsage: gpu?.utilizationGpu,
        vramTotal: gpu?.memoryTotal,
        vramUsed: gpu?.memoryUsed,
      });
    }, 1000);
  }

  async init() {
    await this.storage.init();
    await this.reload();
  }

  private resolvePath(value: string | undefined) {
    return resolveConfigPath(value, this.dataRoot);
  }

  async reload() {
    await this.reloadPython();
    this.restartKohya();
    this.restartComfy();
  }

  async reloadPython() {
    const config = await this.storage.config.all();
    if (!this.settings.skipPythonSetup && !config.python.configured) {
      this.python = await PythonInstance.fromSystem();
      return;
    }

    const useSystemPython =
      this.settings.skipPythonSetup ||
      config.python.mode === 'system' ||
      !config.python.pythonHome;

    this.python = useSystemPython
      ? await PythonInstance.fromSystem(
          this.resolvePath(config.python.packagesDir),
        )
      : await PythonInstance.fromDirectory(
          this.resolvePath(config.python.pythonHome)!,
          this.resolvePath(config.python.packagesDir),
        );
  }

  restartKohya() {
    if (!this.python) {
      return;
    }

    this.kohya?.removeAllListeners();
    this.kohya?.stopAll();

    this.kohya = new Kohya(this.python!);
    this.kohya.on('event', this.onEvent);
  }

  async restartComfy() {
    this.comfy?.removeAllListeners();
    this.comfy?.stop(true);

    const config = await this.storage.config.all();
    if (
      !this.python ||
      (!this.settings.skipPythonSetup && !config.python.configured)
    ) {
      return;
    }

    this.comfy = new Comfy(
      this.python,
      this.settings.comfyMainPath,
      config.comfy?.args,
      config.comfy?.env,
    );

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

    comfy.on('log', e => {
      this.emit('backendLog', e);
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

    const project = await this.project.get(projectId);
    const id = nanoid();
    this.settingsCache[id] = settings;

    settings.models.base.path ||= this.storage.models.path(
      ModelType.CHECKPOINT,
      settings.models.base.name,
    );

    const embeddingsDir = this.storage.models.dir(ModelType.EMBEDDING);
    if (await exists(embeddingsDir)) {
      settings.models.base.embeddings_path = embeddingsDir;
    }

    if (settings.models.loras) {
      settings.models.loras = settings.models.loras
        .filter(model => model.enabled && model.name)
        .map(model => ({
          ...model,
          path:
            model.path || this.storage.models.path(ModelType.LORA, model.name!),
        }));
    }

    if (settings.models.controlnets) {
      settings.models.controlnets = settings.models.controlnets
        .filter(model => model.enabled && model.name)
        .map(model => ({
          ...model,
          path:
            model.path ||
            this.storage.models.path(ModelType.CONTROLNET, model.name!),
        }));
    }

    if (settings.models.upscale?.name && settings.models.upscale?.enabled) {
      settings.models.upscale.path ||= this.storage.models.path(
        ModelType.UPSCALE_MODEL,
        settings.models.upscale.name,
      );
    } else {
      settings.models.upscale = undefined;
    }

    if (settings.models.ipadapters) {
      settings.models.ipadapters = settings.models.ipadapters
        .filter(
          model =>
            model.enabled &&
            model.name &&
            model.clip_vision_name &&
            model.image,
        )
        .map(model => ({
          ...model,
          path:
            model.path ||
            this.storage.models.path(ModelType.IPADAPTER, model.name!),
          clip_vision_path:
            model.path ||
            this.storage.models.path(
              ModelType.CLIP_VISION,
              model.clip_vision_name!,
            ),
        }));
    }

    if (settings.sampler.preview?.method === 'taesd') {
      const list = await this.storage.models.type(ModelType.VAE_APPROX);
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
      output_path: project.output.path,
    });

    return { id };
  }

  async train(projectId: Project['id'], settings: ProjectTrainingSettings) {
    const project = await this.project.get(projectId);
    settings.base.path ||= this.storage.models.path(
      ModelType.CHECKPOINT,
      settings.base.name,
    );

    return await this.kohya?.train(project, settings);
  }

  stopTraining(projectId: Project['id']) {
    return this.kohya?.stop(projectId);
  }

  async downloadModel(data: DownloadSettings) {
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

    const basename = path.basename(savePath);
    if (
      this.tasks.queues.downloads.tasks.find(
        item => item.data.name === basename,
      )
    ) {
      return;
    }

    const headers: Record<string, string> = {};
    if (url.hostname.includes('civitai')) {
      const settings = await this.storage.config.get('civitai');
      if (settings?.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
    }

    return this.tasks.queues.downloads.add(
      new DownloadModelTask(data, savePath),
    );
  }

  async info() {
    return {
      samplers: this.comfy?.samplers || [],
      schedulers: this.comfy?.schedulers || [],
      models: await this.storage.models.all(),
    };
  }
}

export * from './trpc.js';

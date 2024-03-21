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
  ProjectTaggingSettings,
} from '@metastable/types';

import { Setup } from './setup/index.js';
import { Comfy } from './comfy/index.js';
import { PythonInstance } from './python/index.js';
import { Storage } from './storage/index.js';
import { resolveConfigPath } from './helpers/fs.js';
import { DownloadModelTask } from './downloader/index.js';
import { Tasks } from './tasks/index.js';
import { Kohya } from './kohya/index.js';
import { ProjectEntity } from './data/project.js';
import { EntityRepository } from './data/common.js';
import { TypedEventEmitter } from './types.js';
import { Tagger } from './kohya/tagger.js';
import { ModelRepository } from './data/model.js';

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
  tagger?: Tagger;
  project;
  model;

  onEvent = async (event: AnyEvent) => {
    console.log(`[${new Date().toISOString()}]`, event);

    if (event.event === 'prompt.end') {
      const settings = this.settingsCache[event.data.id];
      event.data.outputs = [];
      try {
        const project = await this.project.get(event.data.project_id);
        for (const filename of event.data.output_filenames) {
          const output = await project.output.get(filename);
          await output.metadata.set(settings);
          event.data.outputs.push(await output.json());
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
    this.model = new ModelRepository(path.join(this.dataRoot, 'models'));
    this.setup.on('event', this.onEvent);
    this.tasks.on('event', this.onEvent);

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

    this.tagger?.removeAllListeners();
    this.tagger?.stopAll();

    this.tagger = new Tagger(this.python!);
    this.tagger.on('event', this.onEvent);
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
    }
  }

  async prompt(projectId: Project['id'], settings: ProjectSettings) {
    if (this.comfy?.status !== 'ready') {
      return undefined;
    }

    const project = await this.project.get(projectId);
    const id = nanoid();
    this.settingsCache[id] = settings;

    if (!settings.models.base.path) {
      const model = await this.model.get(
        ModelType.CHECKPOINT,
        settings.models.base.name,
      );
      settings.models.base.path = model.path;
    }

    const embeddingsPath = await this.model.getEmbeddingsPath();
    if (embeddingsPath) {
      settings.models.base.embeddings_path = embeddingsPath;
    }

    if (settings.models.loras) {
      settings.models.loras = settings.models.loras.filter(
        model => model.enabled && model.name,
      );

      for (const modelSettings of settings.models.loras) {
        if (!modelSettings.path) {
          const model = await this.model.get(
            ModelType.LORA,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }
      }
    }

    if (settings.models.controlnets) {
      settings.models.controlnets = settings.models.controlnets.filter(
        model => model.enabled && model.name && model.image,
      );

      for (const modelSettings of settings.models.controlnets) {
        if (!modelSettings.path) {
          const model = await this.model.get(
            ModelType.CONTROLNET,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }
      }
    }

    if (settings.models.upscale?.name && settings.models.upscale?.enabled) {
      if (!settings.models.upscale.path) {
        const model = await this.model.get(
          ModelType.UPSCALE_MODEL,
          settings.models.upscale.name,
        );
        settings.models.upscale.path = model.path;
      }
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
            this.model.getEntityPath(ModelType.IPADAPTER, model.name!),
          clip_vision_path:
            model.path ||
            this.model.getEntityPath(
              ModelType.CLIP_VISION,
              model.clip_vision_name!,
            ),
        }));

      for (const modelSettings of settings.models.ipadapters) {
        if (!modelSettings.path) {
          const model = await this.model.get(
            ModelType.IPADAPTER,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }

        if (!modelSettings.clip_vision_path) {
          const model = await this.model.get(
            ModelType.CLIP_VISION,
            modelSettings.clip_vision_name!,
          );
          modelSettings.clip_vision_path = model.path;
        }
      }
    }

    if (settings.sampler.preview?.method === 'taesd') {
      const decoderModel = await this.model.get(
        ModelType.VAE_APPROX,
        'taesd_decoder',
      );
      const decoderXlModel = await this.model.get(
        ModelType.VAE_APPROX,
        'taesdxl_decoder',
      );
      settings.sampler.preview.taesd = {
        taesd_decoder: decoderModel.path,
        taesdxl_decoder: decoderXlModel.path,
      };
    }

    settings.sampler.tiling = !!settings.sampler.tiling;

    await this.comfy?.invoke(undefined, 'legacy:prompt', {
      ...settings,
      id: id,
      project_id: projectId,
      output: {
        path: project.output.path,
        format: 'png',
        ...(settings.output || {}),
      },
    });

    return { id };
  }

  async train(projectId: Project['id'], settings: ProjectTrainingSettings) {
    const project = await this.project.get(projectId);
    if (!settings.base.path) {
      const model = await this.model.get(
        ModelType.CHECKPOINT,
        settings.base.name,
      );
      settings.base.path = model.path;
    }

    return await this.kohya?.train(project, settings);
  }

  async tag(projectId: Project['id'], settings: ProjectTaggingSettings) {
    const project = await this.project.get(projectId);
    if (!settings.tagger.path) {
      const model = await this.model.get(
        ModelType.TAGGER,
        settings.tagger.name,
      );
      settings.tagger.path = model.path;
    }

    return await this.tagger?.run(project, settings);
  }

  stopTraining(projectId: Project['id']) {
    return this.kohya?.stop(projectId);
  }

  async downloadModel(data: DownloadSettings) {
    const savePath = this.model.getEntityPath(
      data.type as ModelType,
      data.name,
    );

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
      new DownloadModelTask(data, savePath, headers),
    );
  }
}

export * from './trpc.js';
export { setUseFileUrl } from './helpers/url.js';

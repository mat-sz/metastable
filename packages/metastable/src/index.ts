import EventEmitter from 'events';
import path from 'path';

import {
  AnyEvent,
  BackendStatus,
  DownloadSettings,
  LogItem,
  ModelType,
  Project,
  ProjectSimpleSettings,
  ProjectTaggingSettings,
  ProjectTrainingSettings,
  Utilization,
} from '@metastable/types';
import checkDiskSpace from 'check-disk-space';
import si from 'systeminformation';

import { Comfy } from './comfy/index.js';
import { PromptTask } from './comfy/tasks/prompt.js';
import { TagTask } from './comfy/tasks/tag.js';
import { EntityRepository } from './data/common.js';
import { ModelRepository } from './data/model.js';
import { ProjectEntity } from './data/project.js';
import { DownloadModelTask } from './downloader/index.js';
import { CircularBuffer } from './helpers/buffer.js';
import { resolveConfigPath } from './helpers/fs.js';
import { Kohya } from './kohya/index.js';
import { PythonInstance } from './python/index.js';
import { Setup } from './setup/index.js';
import { Storage } from './storage/index.js';
import { Tasks } from './tasks/index.js';
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
  setup = new Setup(this);
  tasks = new Tasks();
  kohya?: Kohya;
  project;
  model;

  status: BackendStatus = 'starting';
  logBuffer = new CircularBuffer<LogItem>(25);

  onEvent = async (event: AnyEvent) => {
    this.emit('event', event);

    if (event.event === 'task.update' && event.data.queueId === 'project') {
      // Hide prompt updates, so preview URLs don't obscure other important events.
      return;
    }
    console.log(`[${new Date().toISOString()}]`, event);
  };

  constructor(
    private dataRoot: string,
    private settings: {
      comfyMainPath?: string;
      skipPythonSetup?: boolean;
      comfyArgs?: string[];
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
      if (!this.listenerCount('utilization')) {
        return;
      }

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

    process.on('beforeExit', () => {
      this.handleExit();
    });
    process.on('SIGINT', () => {
      this.handleExit();
    });
    process.on('SIGUSR1', () => {
      this.handleExit();
    });
    process.on('SIGUSR2', () => {
      this.handleExit();
    });
  }

  async handleExit() {
    console.log('Cleaning up and exiting...');
    await this.cleanup();
    console.log('Bye!');
    process.exit(0);
  }

  async init() {
    this.cleanup();
    await this.reload();
  }

  private resolvePath(value: string | undefined) {
    return resolveConfigPath(value, this.dataRoot);
  }

  async cleanup() {
    const projects = await this.project.all();
    for (const project of projects) {
      try {
        const data = await project.metadata.get();
        if (data.temporary) {
          await project.delete();
        }
      } catch {}
    }
  }

  async reload() {
    await this.reloadPython();
    await this.restartComfy();
    this.restartKohya();
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

    try {
      this.python = useSystemPython
        ? await PythonInstance.fromSystem(
            this.resolvePath(config.python.packagesDir),
          )
        : await PythonInstance.fromDirectory(
            this.resolvePath(config.python.pythonHome)!,
            this.resolvePath(config.python.packagesDir),
          );
    } catch {
      this.logBuffer.push({
        timestamp: Date.now(),
        text: 'Unable to find Python binary',
        type: 'stderr',
      });
      this.setStatus('error');
    }
  }

  setStatus(status: BackendStatus) {
    this.status = status;
    this.emit('event', { event: 'backend.status', data: status });
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

    this.setStatus('starting');
    this.comfy = new Comfy(
      this.python,
      this.settings.comfyMainPath,
      [...(config.comfy?.args || []), ...(this.settings.comfyArgs || [])],
      config.comfy?.env,
    );

    const comfy = this.comfy;
    comfy.on('event', this.onEvent);
    comfy.on('status', status => this.setStatus(status));

    comfy.on('log', e => {
      this.logBuffer.push(e);
      this.emit('backendLog', [e]);
    });
  }

  replayEvents(onEvent: (event: any) => void) {
    onEvent({
      event: 'backend.status',
      data: this.status,
    });
  }

  async prompt(projectId: Project['id'], settings: ProjectSimpleSettings) {
    if (this.status !== 'ready') {
      return undefined;
    }

    const project = await this.project.get(projectId);
    const task = new PromptTask(this, project, settings);
    this.tasks.queues.project.add(task);

    return { id: task.id };
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
    if (this.status !== 'ready') {
      return undefined;
    }

    const project = await this.project.get(projectId);
    const task = new TagTask(this, project, settings);
    this.tasks.queues.project.add(task);

    return { id: task.id };
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

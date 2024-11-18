import EventEmitter from 'events';
import { mkdir } from 'fs/promises';
import os from 'os';
import path from 'path';

import { MRN } from '@metastable/common';
import {
  BackendStatus,
  DownloadSettings,
  LogItem,
  ModelType,
  Utilization,
} from '@metastable/types';

import { Comfy } from './comfy/index.js';
import { Config } from './config/index.js';
import { ModelRepository } from './data/model.js';
import { ProjectRepository } from './data/project.js';
import { DownloadModelTask } from './downloader/index.js';
import { FeaturePython } from './feature/base.js';
import { FeatureManager } from './feature/index.js';
import { CircularBuffer } from './helpers/buffer.js';
import { getBundleTorchMode } from './helpers/bundle.js';
import { resolveConfigPath, rmdir } from './helpers/fs.js';
import { parseArgString } from './helpers/shell.js';
import { PythonInstance } from './python/index.js';
import { Setup } from './setup/index.js';
import * as cpu from './sysinfo/cpu.js';
import * as disk from './sysinfo/disk.js';
import { gpu, gpuUtilization } from './sysinfo/gpu.js';
import * as ram from './sysinfo/ram.js';
import { Tasks } from './tasks/index.js';
import { TypedEventEmitter } from './types.js';

type MetastableEvents = {
  utilization: (data: Utilization) => void;
  backendLog: (data: LogItem[]) => void;
  backendStatus: (status: BackendStatus) => void;
  infoUpdate: () => void;
};

export class Metastable extends (EventEmitter as {
  new (): TypedEventEmitter<MetastableEvents>;
}) {
  private static _instance: Metastable;

  config;
  python?: PythonInstance;
  comfy?: Comfy;
  setup = new Setup();
  tasks = new Tasks();
  feature = new FeatureManager();
  project;
  model;
  vram = 0;
  internalPath;

  status: BackendStatus = 'starting';
  logBuffer = new CircularBuffer<LogItem>(25);
  enabledFeatures: string[] = [];
  enabledNamespaceGroups: string[] = [];

  constructor(
    public readonly dataRoot: string,
    public readonly settings: {
      comfyMainPath?: string;
      skipPythonSetup?: boolean;
      comfyArgs?: string[];
      version?: string;
    } = {},
  ) {
    super();
    if (Metastable._instance) {
      throw new Error(
        'Attempted to create multiple instances of Metastable object.',
      );
    }
    Metastable._instance = this;

    this.setup.skipPythonSetup = !!settings.skipPythonSetup;
    this.config = new Config(path.join(dataRoot, 'config.json'));
    this.internalPath = path.join(dataRoot, 'internal');
    this.project = new ProjectRepository(path.join(this.dataRoot, 'projects'));
    this.model = new ModelRepository(path.join(this.dataRoot, 'models'));

    setTimeout(() => {
      this.refreshUtilization();
    }, 2000);
  }

  static get instance() {
    return this._instance;
  }

  async refreshUtilization() {
    if (!this.listenerCount('utilization')) {
      setTimeout(() => {
        this.refreshUtilization();
      }, 1000);
      return;
    }

    const [load, free, usage] = await Promise.all([
      cpu.load(),
      ram.free(),
      disk.usage(this.dataRoot),
    ]);

    const gpu = await gpuUtilization();
    this.emit('utilization', {
      cpuUsage: load,
      hddTotal: usage.size,
      hddUsed: usage.used,
      ramTotal: free.total,
      ramUsed: free.used,
      gpuTemperature: gpu?.temperatureGpu,
      gpuUsage: gpu?.utilizationGpu,
      vramTotal: gpu?.memoryTotal,
      vramUsed: gpu?.memoryUsed,
    });
    setTimeout(() => {
      this.refreshUtilization();
    }, 1000);
  }

  async handleExit() {
    console.log('Cleaning up and exiting...');
    await this.model.cleanup();
    await this.project.cleanup();
    console.log('Bye!');
    process.exit(0);
  }

  async init() {
    await mkdir(this.internalPath, { recursive: true });
    this.updateVram();
    await this.reload();
  }

  private resolvePath(value: string | undefined) {
    return resolveConfigPath(value, this.dataRoot);
  }

  async updateVram() {
    const controllers = await gpu();
    let vram = 0;
    for (const gpu of controllers) {
      if (gpu.vram > vram) {
        vram = gpu.vram;
      }
    }

    this.vram = vram;
  }

  async reload() {
    await this.reloadPython();
    await this.restartComfy();
  }

  async reloadPython() {
    const config = await this.config.all();
    if (!this.settings.skipPythonSetup && !config.python.configured) {
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
    if (this.status !== status) {
      this.emit('backendStatus', status);

      if (status === 'ready') {
        this.infoUpdated();
      }
    }
    this.status = status;
  }

  infoUpdated() {
    this.emit('infoUpdate');
  }

  async stopComfy() {
    this.comfy?.removeAllListeners();
    this.comfy?.stop(true);
  }

  async deleteBundle() {
    this.stopComfy();
    this.setStatus('starting');
    const pythonDir = this.python?.pythonHome;
    this.python = undefined;
    if (pythonDir) {
      try {
        await rmdir(pythonDir);
      } catch {}
    }
  }

  async resetSettings() {
    await this.config.resetExceptFor('python');
    await this.restartComfy();
  }

  async refreshFeatures() {
    const features = this.feature.availableFeatures;
    for (const feature of features) {
      if (!(await feature.isEnabled())) {
        continue;
      }

      this.enabledFeatures.push(feature.id);

      if (feature instanceof FeaturePython && feature.pythonNamespaceGroup) {
        this.enabledNamespaceGroups.push(feature.pythonNamespaceGroup);
      }
    }
  }

  async restartComfy() {
    this.stopComfy();

    const config = await this.config.all();
    if (
      !this.python ||
      (!this.settings.skipPythonSetup && !config.python.configured)
    ) {
      return;
    }

    const args: string[] = [];

    if (this.settings.comfyArgs) {
      args.push(...this.settings.comfyArgs);
    }

    const { pythonHome } = this.python;
    if (pythonHome) {
      const torchMode = await getBundleTorchMode(pythonHome);

      if (torchMode === 'directml') {
        args.push('--directml');
      }
    }

    if (os.platform() === 'darwin' && os.arch() === 'arm64') {
      args.push('--force-fp16');
    }

    if (config.comfy) {
      const { vramMode = 'auto', extraArgs } = config.comfy;

      if (vramMode !== 'auto') {
        args.push(`--${vramMode}`);
      }

      if (extraArgs) {
        args.push(...parseArgString(extraArgs));
      }
    }

    await this.python.refreshPackages();
    await this.refreshFeatures();
    for (const group of this.enabledNamespaceGroups) {
      args.push('--namespace', group);
    }

    this.setStatus('starting');
    this.comfy = new Comfy(
      this.python,
      this.settings.comfyMainPath,
      args,
      config.comfy?.env,
    );

    const comfy = this.comfy;
    comfy.on('status', status => this.setStatus(status));

    comfy.on('log', e => {
      this.logBuffer.push(e);
      this.emit('backendLog', [e]);
    });
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
      const settings = await this.config.get('civitai');
      const apiKey = settings?.apiKey?.trim();
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    return this.tasks.queues.downloads.add(
      new DownloadModelTask(data, savePath, headers),
    );
  }

  async resolve(mrn: string) {
    const parsed = MRN.parse(mrn);
    const scope = parsed.segments[0];
    let resolved: string | undefined = undefined;

    switch (scope) {
      case 'project':
        resolved = await this.project.resolve(parsed);
        break;
      case 'model':
        resolved = await this.model.resolve(parsed);
        break;
      default:
        throw new Error(`Invalid MRN scope: ${scope}`);
    }

    if (!resolved) {
      throw new Error(`File not found: ${mrn}`);
    }

    return resolved;
  }
}

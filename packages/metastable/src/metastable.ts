import { EventEmitter } from 'events';
import { mkdir } from 'fs/promises';
import os from 'os';
import path from 'path';

import { JSONFile } from '@metastable/common/fs';
import { MRN } from '@metastable/common/mrn';
import {
  BackendStatus,
  DownloadSettings,
  LogItem,
  ProjectFileType,
  Utilization,
} from '@metastable/types';

import { CircularBuffer } from '#helpers/buffer.js';
import { getBundleTorchMode } from '#helpers/bundle.js';
import { errorToString } from '#helpers/common.js';
import { getAuthorizationStrategy } from '#helpers/download.js';
import { resolveConfigPath, rmdir } from '#helpers/fs.js';
import { parseArgString } from '#helpers/shell.js';
import { Auth } from './auth/index.js';
import { Comfy } from './comfy/index.js';
import { Config } from './config/index.js';
import { ModelRepository } from './data/model.js';
import { ProjectRepository } from './data/project.js';
import { DownloadModelTask } from './downloader/index.js';
import { FeaturePython } from './feature/base.js';
import { FeatureManager } from './feature/index.js';
import { PythonInstance } from './python/index.js';
import { Setup } from './setup/index.js';
import * as cpu from './sysinfo/cpu.js';
import * as disk from './sysinfo/disk.js';
import { getHipSdkPath, getHipSdkVersion } from './sysinfo/gpu/amd/hipInfo.js';
import { gpu, gpuUtilization } from './sysinfo/gpu.js';
import * as ram from './sysinfo/ram.js';
import { Tasks } from './tasks/index.js';

interface MetastableEvents {
  utilization: [data: Utilization];
  backendStatus: [status: BackendStatus];
  infoUpdate: [];
  'project.fileChange': [id: string, type: ProjectFileType];
  'model.change': [];
  'config.change': [];
  'comfy.modelCacheChange': [];
}

export interface MetastableInstanceConfig {
  dataConfigPath?: string;
  dataRoot: string;
  comfyMainPath?: string;
  skipPythonSetup?: boolean;
  comfyArgs?: string[];
  version?: string;
  enableAuth?: boolean;
}

export class Metastable extends EventEmitter<MetastableEvents> {
  private static _instance: Metastable;

  dataConfig?: JSONFile<{ dataRoot?: string }>;
  config!: Config;
  python?: PythonInstance;
  comfy?: Comfy;
  auth!: Auth;
  setup = new Setup();
  tasks = new Tasks();
  feature = new FeatureManager();
  project!: ProjectRepository;
  model!: ModelRepository;
  vram = 0;

  status: BackendStatus = 'starting';
  logBuffer = new CircularBuffer<LogItem>(100);
  enabledFeatures: string[] = [];
  enabledNamespaceGroups: string[] = [];
  private _dataRoot!: string;

  constructor(public readonly settings: MetastableInstanceConfig) {
    super();
    if (Metastable._instance) {
      throw new Error(
        'Attempted to create multiple instances of Metastable object.',
      );
    }
    Metastable._instance = this;

    if (settings.dataConfigPath) {
      this.dataConfig = new JSONFile(settings.dataConfigPath, {});
    }

    this.setup.skipPythonSetup = !!settings.skipPythonSetup;
  }

  static async initialize(settings: MetastableInstanceConfig) {
    const metastable = new Metastable(settings);
    if (metastable.dataConfig) {
      const json = await metastable.dataConfig.readJson();
      if (json.dataRoot) {
        settings.dataRoot = path.resolve(
          settings.dataRoot,
          '..',
          json.dataRoot,
        );
      }
    }

    await metastable.setDataRoot(settings.dataRoot);
    metastable.updateVram();

    setTimeout(() => {
      metastable.refreshUtilization();
    }, 2000);

    return metastable;
  }

  async setDataRoot(dataRoot: string, persist = false) {
    if (persist && this.dataConfig) {
      await this.dataConfig.writeJson({ dataRoot });
    }

    if (this.project) {
      this.project.removeAllListeners();
      await this.project.cleanup();
    }

    if (this.model) {
      this.model.removeAllListeners();
      await this.model.cleanup();
    }

    this.config?.removeAllListeners();

    this._dataRoot = dataRoot;
    await mkdir(this.internalPath, { recursive: true });

    this.config = new Config(path.join(this.dataRoot, 'config.json'));
    this.project = new ProjectRepository(path.join(this.dataRoot, 'projects'));
    this.model = new ModelRepository(path.join(this.dataRoot, 'models'));
    this.auth = new Auth(
      this.settings.enableAuth
        ? path.join(this.dataRoot, 'auth.json')
        : undefined,
    );
    this.infoUpdated();
    await this.project.deleteDrafts();

    this.project.on('fileChange', (id, type) =>
      this.emit('project.fileChange', id, type),
    );
    this.model.on('change', () => this.emit('model.change'));
    this.config.on('change', () => this.emit('config.change'));

    this.reload();
  }

  static get instance() {
    return this._instance;
  }

  get dataRoot() {
    return this._dataRoot;
  }

  get internalPath() {
    return path.join(this._dataRoot, 'internal');
  }

  async refreshUtilization() {
    if (!this.listenerCount('utilization')) {
      setTimeout(() => {
        this.refreshUtilization();
      }, 1000);
      return;
    }

    try {
      // TODO: replace with allSettled
      const [load, free, usage] = await Promise.all([
        cpu.load(),
        ram.free(),
        disk.usage(this.dataRoot),
      ]);

      const gpu = await gpuUtilization();
      this.emit('utilization', {
        cpuUsage: load,
        hddTotal: usage.total,
        hddUsed: usage.used,
        ramTotal: free.total,
        ramUsed: free.used,
        gpuTemperature: gpu?.temperature,
        gpuUsage: gpu?.utilization,
        vramTotal: gpu?.vram,
        vramUsed: gpu?.vramUsed,
      });
    } catch {}

    setTimeout(() => {
      this.refreshUtilization();
    }, 1000);
  }

  async handleExit(exit = true) {
    console.log('Cleaning up and exiting...');
    await this.model.cleanup();
    await this.project.cleanup();
    console.log('Bye!');
    if (exit) {
      process.exit(0);
    }
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
    if (!(this.settings.skipPythonSetup || config.python.configured)) {
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

  stopComfy() {
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
    const enabledFeatures = [];
    const enabledNamespaceGroups = [];
    const features = this.feature.availableFeatures;

    for (const feature of features) {
      if (!(await feature.isEnabled())) {
        continue;
      }

      enabledFeatures.push(feature.id);

      if (feature instanceof FeaturePython && feature.pythonNamespaceGroup) {
        enabledNamespaceGroups.push(feature.pythonNamespaceGroup);
      }
    }

    this.enabledFeatures = enabledFeatures;
    this.enabledNamespaceGroups = enabledNamespaceGroups;
  }

  private async getComfyOptions() {
    const config = await this.config.all();

    const args: string[] = [];

    if (this.settings.comfyArgs) {
      args.push(...this.settings.comfyArgs);
    }

    if (os.platform() === 'darwin' && os.arch() === 'arm64') {
      args.push('--force-fp16');
    }

    if (config.comfy) {
      const {
        vramMode = 'auto',
        reserveVram,
        extraArgs,
        cpuVae = false,
      } = config.comfy;

      if (vramMode !== 'auto') {
        args.push(`--${vramMode}`);
      }

      if (reserveVram) {
        args.push('--reserve-vram', `${reserveVram}`);
      }

      if (extraArgs) {
        args.push(...parseArgString(extraArgs));
      }

      if (cpuVae) {
        args.push('--cpu-vae');
      }
    }

    if (this.python) {
      const { pythonHome } = this.python;
      if (pythonHome) {
        const torchMode = await getBundleTorchMode(pythonHome);

        if (torchMode === 'directml') {
          args.push('--directml');
        } else if (torchMode === 'zluda') {
          const hipVersion = await getHipSdkVersion();
          if (hipVersion) {
            args.push('--zluda-path', path.join(pythonHome, 'zluda'));
            args.push('--hip-path', getHipSdkPath(hipVersion));
            args.push('--hip-version', hipVersion);
          }
        }
      }

      await this.python.refreshPackages();
      await this.refreshFeatures();
      for (const group of this.enabledNamespaceGroups) {
        args.push('--namespace', group);
      }
    }

    return { args, env: config.comfy?.env };
  }

  async restartComfy() {
    try {
      this.stopComfy();

      if (!this.python) {
        return;
      }
      const { args, env } = await this.getComfyOptions();

      this.setStatus('starting');
      const comfy = new Comfy(
        this.python,
        this.settings.comfyMainPath,
        args,
        env,
      );
      comfy.on('status', status => this.setStatus(status));
      comfy.on('log', e => this.logBuffer.push(e));
      comfy.on('modelCacheChange', () => this.emit('comfy.modelCacheChange'));
      this.comfy = comfy;
    } catch (e) {
      this.logBuffer.push({
        text: errorToString(e),
        timestamp: Date.now(),
        type: 'stderr',
      });
      this.setStatus('error');
    }
  }

  async downloadModel(data: DownloadSettings) {
    const savePath = await this.model.getDownloadPath(
      data.type,
      data.name,
      data.folder,
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

    const { apiKeys } = await this.config.get('downloader');
    const result = getAuthorizationStrategy(url.hostname);
    const headers: Record<string, string> = {};

    switch (result?.strategy) {
      case 'bearer': {
        const apiKey = apiKeys[result.id]?.trim();
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        break;
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

  async tryResolve(mrn?: string) {
    if (!mrn) {
      return undefined;
    }

    return await this.resolve(mrn);
  }
}

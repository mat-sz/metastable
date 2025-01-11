import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';

import {
  SetupDetails,
  SetupSettings,
  SetupStatus,
  TorchMode,
} from '@metastable/types';

import { exists } from '#helpers/fs.js';
import { Metastable } from '#metastable';
import { getBundleInfo, getOS } from './helpers.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';
import { ExtractTask } from './tasks/extract.js';
import { BaseDownloadTask } from '../downloader/index.js';
import * as disk from '../sysinfo/disk.js';
import { gpu } from '../sysinfo/gpu.js';
import { CleanupTask } from './tasks/cleanup.js';
import { getHipSdkVersion } from '../sysinfo/gpu/amd/hipInfo.js';

export type SetupEvents = {
  status: [status: SetupStatus];
};

export class Setup extends EventEmitter<SetupEvents> {
  settings: SetupSettings | undefined = undefined;
  skipPythonSetup: boolean = false;
  private _status: SetupStatus = 'required';
  private _pythonHome: string | undefined = undefined;
  private _packagesDir: string | undefined = undefined;
  private _bundleVersion: string | undefined = undefined;

  private _checked = false;

  constructor() {
    super();
  }

  async resetBundle(resetAll = false) {
    await Metastable.instance.config.reset(resetAll ? undefined : 'python');
    await Metastable.instance.deleteBundle();
    this.resetStatus();
    await this.emitStatus();
  }

  resetStatus() {
    this._checked = false;
  }

  async status(): Promise<SetupStatus> {
    if (!this._checked) {
      const python = await Metastable.instance.config.get('python');

      if (python?.configured || this.skipPythonSetup) {
        this._status = 'done';
      } else {
        this._status = 'required';
      }

      this._checked = true;
    }

    return this._status;
  }

  async details(): Promise<SetupDetails> {
    const controllers = await gpu();
    const dataRoot = Metastable.instance.dataRoot;
    const usage = await disk.usage(dataRoot);
    const platform = os.platform();

    return {
      os: await getOS(),
      gpus: controllers
        .filter(item => !!item.name)
        .map(item => {
          const torchModes: TorchMode[] = [];
          const potentialTorchModes: TorchMode[] = [];
          switch (item.source) {
            case 'rocm-smi':
              torchModes.push('rocm');
              break;
            case 'hipInfo':
              torchModes.push('zluda');
              break;
            case 'nvidia-smi':
              torchModes.push('cuda');
              break;
          }

          switch (item.vendor) {
            case 'AMD':
              if (platform === 'win32') {
                torchModes.push('directml');
                potentialTorchModes.push('zluda', 'directml');
              } else if (platform === 'linux') {
                potentialTorchModes.push('rocm');
              }
              break;
            case 'Intel':
              if (item.name?.includes('Arc') && platform === 'win32') {
                torchModes.push('directml');
                potentialTorchModes.push('directml');
              }
              break;
            case 'NVIDIA':
              potentialTorchModes.push('cuda');
              break;
          }

          return {
            vendor: item.vendor || 'unknown',
            name: item.name!,
            vram: item.vram,
            torchModes,
            potentialTorchModes,
          };
        }),
      storage: {
        dataRoot,
        diskPath: usage.diskPath,
        free: usage.free,
        total: usage.size,
      },
    };
  }

  async emitStatus() {
    this.emit('status', await this.status());
  }

  private async done() {
    if (!this.settings) {
      throw new Error('Error.');
    }

    this._status = 'done';
    this.emitStatus();

    await Metastable.instance.config.set('python', {
      configured: true,
      mode: 'static',
      pythonHome: this._pythonHome
        ? path.relative(Metastable.instance.dataRoot, this._pythonHome)
        : undefined,
      packagesDir: this._packagesDir
        ? path.relative(Metastable.instance.dataRoot, this._packagesDir)
        : undefined,
      bundleVersion: this._bundleVersion,
      features: {},
    });

    Metastable.instance.reload();
  }

  async enqueueBundle(
    name: string,
    fileName: string,
    destination: string,
    isBase = false,
  ) {
    const setupQueue = Metastable.instance.tasks.queues.setup;
    const info = await getBundleInfo(name, fileName);
    if (isBase) {
      this._bundleVersion = info.version;
    }

    const savePath = path.join(Metastable.instance.dataRoot, fileName);
    setupQueue.add(
      new BaseDownloadTask(`download.${name}`, info.url, savePath),
    );

    setupQueue.add(
      new ExtractTask(`extract.${name}`, {
        parts: [savePath],
        destination: destination,
      }),
    );
  }

  async start(settings: SetupSettings) {
    if (this.settings) {
      return;
    }

    this.settings = settings;
    this._status = 'in_progress';
    this.emitStatus();

    const setupQueue = Metastable.instance.tasks.queues.setup;
    setupQueue.once('empty', () => {
      setupQueue.purge();
      this.done();
    });

    const targetPath = path.join(Metastable.instance.dataRoot, 'python');
    this._packagesDir = undefined;
    this._pythonHome = targetPath;

    if (await exists(targetPath)) {
      setupQueue.add(new CleanupTask(targetPath));
    }

    const torchMode = this.settings?.torchMode || 'cpu';
    await this.enqueueBundle(
      'torch',
      `${os.platform()}-${os.arch()}-${torchMode}.tar.br`,
      targetPath,
      true,
    );

    if (torchMode === 'zluda') {
      const sdkVersion = await getHipSdkVersion();

      if (sdkVersion) {
        const variant = `rocm${sdkVersion.split('.')[0]}`;
        await this.enqueueBundle(
          'zluda',
          `${os.platform()}-${os.arch()}-${variant}.tar.br`,
          targetPath,
        );
      }
    }

    if (settings.downloads.length) {
      Metastable.instance.tasks.queues.setup.add(
        new DownloadModelsTask(settings.downloads),
      );
    }

    setupQueue.next();
  }
}

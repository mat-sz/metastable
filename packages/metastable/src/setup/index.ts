import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';

import { SetupDetails, SetupSettings, SetupStatus } from '@metastable/types';

import { Metastable } from '#metastable';
import { getLatestReleaseInfo, getOS } from './helpers.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';
import { ExtractTask } from './tasks/extract.js';
import { MultiDownloadTask } from '../downloader/index.js';
import * as disk from '../sysinfo/disk.js';
import { gpu } from '../sysinfo/gpu.js';
import { TypedEventEmitter } from '../types.js';

export type SetupEvents = {
  status: (status: SetupStatus) => void;
};

export class Setup extends (EventEmitter as {
  new (): TypedEventEmitter<SetupEvents>;
}) {
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

    return {
      os: await getOS(),
      graphics: controllers.map(item => {
        return {
          vendor: item.vendor || 'unknown',
          vram: item.vram,
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

    const baseRelease = await getLatestReleaseInfo(
      'metastable-studio/bundle-torch',
    );
    this._bundleVersion = baseRelease.name;

    const assets = baseRelease.assets.filter(item =>
      item.name.startsWith(
        `${os.platform()}-${os.arch()}-${this.settings?.torchMode || 'cpu'}`,
      ),
    );

    setupQueue.add(
      new MultiDownloadTask(
        'download',
        assets.map(asset => ({
          url: asset.browser_download_url,
          savePath: path.join(Metastable.instance.dataRoot, asset.name),
        })),
      ),
    );

    const targetPath = path.join(Metastable.instance.dataRoot, 'python');
    this._packagesDir = undefined;
    this._pythonHome = targetPath;
    const parts = assets.map(asset =>
      path.join(Metastable.instance.dataRoot, asset.name),
    );
    setupQueue.add(new ExtractTask(parts, targetPath));

    if (settings.downloads.length) {
      Metastable.instance.tasks.queues.setup.add(
        new DownloadModelsTask(settings.downloads),
      );
    }
  }
}

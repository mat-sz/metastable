import os from 'os';
import path from 'path';

import { SetupDetails, SetupSettings, SetupStatus } from '@metastable/types';

import { exists } from '#helpers/fs.js';
import { Metastable } from '#metastable';
import { getLatestReleaseInfo, getOS } from './helpers.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';
import { ExtractTask } from './tasks/extract.js';
import { MultiDownloadTask } from '../downloader/index.js';
import { EventEmitter } from '../helpers/events.js';
import * as disk from '../sysinfo/disk.js';
import { gpu } from '../sysinfo/gpu.js';
import { CleanupTask } from './tasks/cleanup.js';
import { getHipSdkVersion } from '../sysinfo/gpu/amd/hipInfo.js';

export type SetupEvents = {
  status: (status: SetupStatus) => void;
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
      environment: {
        hipSdkVersion: await getHipSdkVersion(),
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
    sourceRepo: string,
    destination: string,
    versionPrefix: string,
    isBase = false,
  ) {
    const setupQueue = Metastable.instance.tasks.queues.setup;
    const release = await getLatestReleaseInfo(sourceRepo);
    if (isBase) {
      this._bundleVersion = release.name;
    }

    const assets = release.assets.filter(item =>
      item.name.startsWith(versionPrefix),
    );

    setupQueue.add(
      new MultiDownloadTask(
        `download.${name}`,
        assets.map(asset => ({
          url: asset.browser_download_url,
          savePath: path.join(Metastable.instance.dataRoot, asset.name),
        })),
      ),
    );

    const parts = assets.map(asset =>
      path.join(Metastable.instance.dataRoot, asset.name),
    );
    setupQueue.add(
      new ExtractTask(`extract.${name}`, {
        parts,
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
      'metastable-studio/bundle-torch',
      targetPath,
      `${os.platform()}-${os.arch()}-${torchMode}`,
      true,
    );

    if (torchMode === 'zluda') {
      const sdkVersion = await getHipSdkVersion();

      if (sdkVersion) {
        const variant = `rocm${sdkVersion.split('.')[0]}`;
        await this.enqueueBundle(
          'zluda',
          'metastable-studio/bundle-zluda',
          targetPath,
          `${os.platform()}-${os.arch()}-${variant}`,
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

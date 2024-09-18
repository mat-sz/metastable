import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';

import { SetupDetails, SetupSettings, SetupStatus } from '@metastable/types';
import si from 'systeminformation';

import { getLatestReleaseInfo, getOS } from './helpers.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';
import { ExtractTask } from './tasks/extract.js';
import { MultiDownloadTask } from '../downloader/index.js';
import type { Metastable } from '../index.js';
import * as disk from '../sysinfo/disk.js';
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

  constructor(private metastable: Metastable) {
    super();
  }

  async status(): Promise<SetupStatus> {
    if (!this._checked) {
      const python = await this.metastable.config.get('python');

      if (python?.configured || this.skipPythonSetup) {
        this._status = 'done';
      }
    }

    return this._status;
  }

  async details(): Promise<SetupDetails> {
    const graphics = await si.graphics();
    const dataRoot = this.metastable.dataRoot;
    const usage = await disk.usage(dataRoot);
    const memory = os.totalmem();

    return {
      os: await getOS(),
      graphics: graphics.controllers.map(item => {
        const normalized = item.vendor.toLowerCase();
        let vendor = 'unknown';
        if (normalized.includes('apple')) {
          vendor = 'Apple';
        } else if (
          normalized.includes('advanced') ||
          normalized.includes('amd')
        ) {
          vendor = 'AMD';
        } else if (normalized.includes('nvidia')) {
          vendor = 'NVIDIA';
        }

        return {
          vendor,
          vram: item.vram
            ? item.vram * 1024 * 1024
            : vendor === 'Apple'
              ? memory
              : 0,
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

    await this.metastable.config.set('python', {
      configured: true,
      mode: 'static',
      pythonHome: this._pythonHome
        ? path.relative(this.metastable.dataRoot, this._pythonHome)
        : undefined,
      packagesDir: this._packagesDir
        ? path.relative(this.metastable.dataRoot, this._packagesDir)
        : undefined,
      bundleVersion: this._bundleVersion,
    });

    const platform = os.platform();
    if (this.settings.torchMode === 'directml') {
      await this.metastable.config.set('comfy', {
        args: ['--directml'],
      });
    } else if (platform === 'darwin' && os.arch() === 'arm64') {
      await this.metastable.config.set('comfy', {
        args: ['--force-fp16'],
      });
    }

    this.metastable.reload();
  }

  async start(settings: SetupSettings) {
    if (this.settings) {
      return;
    }

    this.settings = settings;
    this._status = 'in_progress';
    this.emitStatus();

    const setupQueue = this.metastable.tasks.queues.setup;
    setupQueue.once('empty', () => {
      setupQueue.purge();
      this.done();
    });

    const baseRelease = await getLatestReleaseInfo(
      'metastable-studio/bundle-base',
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
          savePath: path.join(this.metastable.dataRoot, asset.name),
        })),
      ),
    );

    const targetPath = path.join(this.metastable.dataRoot, 'python');
    this._packagesDir = undefined;
    this._pythonHome = targetPath;
    const parts = assets.map(asset =>
      path.join(this.metastable.dataRoot, asset.name),
    );
    setupQueue.add(new ExtractTask(parts, targetPath));

    if (settings.downloads.length) {
      this.metastable.tasks.queues.setup.add(
        new DownloadModelsTask(this.metastable, settings.downloads),
      );
    }
  }
}

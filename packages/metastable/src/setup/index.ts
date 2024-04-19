import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';

import { SetupDetails, SetupSettings, SetupStatus } from '@metastable/types';
import checkDiskSpace from 'check-disk-space';
import si from 'systeminformation';

import { getOS, getPython } from './helpers.js';
import { ConfigurePythonTask } from './tasks/configurePython.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';
import { DownloadPythonTask } from './tasks/downloadPython.js';
import type { Metastable } from '../index.js';

export class Setup extends EventEmitter {
  settings: SetupSettings | undefined = undefined;
  skipPythonSetup: boolean = false;
  private _status: SetupStatus['status'] = 'required';
  private _pythonHome: string | undefined = undefined;
  private _packagesDir: string | undefined = undefined;

  private _checked = false;

  constructor(private metastable: Metastable) {
    super();
  }

  async status(): Promise<SetupStatus> {
    if (!this._checked) {
      const python = await this.metastable.storage.config.get('python');

      if (python?.configured || this.skipPythonSetup) {
        this._status = 'done';
      }
    }

    return {
      status: this._status,
    };
  }

  async details(): Promise<SetupDetails> {
    const graphics = await si.graphics();
    const dataRoot = this.metastable.storage.dataRoot;
    // @ts-expect-error This library doesn't work well with TS.
    const usage = await checkDiskSpace(dataRoot);

    return {
      os: await getOS(),
      graphics: graphics.controllers.map(item => ({
        vendor: item.vendor || 'unknown',
        vram: item.vram ? item.vram * 1024 * 1024 : 0,
      })),
      python: await getPython(this.metastable.python),
      storage: {
        dataRoot,
        diskPath: usage.diskPath,
        free: usage.free,
        total: usage.size,
      },
    };
  }

  private async emitStatus() {
    this.emit('event', {
      event: 'setup.status',
      data: await this.status(),
    });
  }

  private async done() {
    if (!this.settings) {
      throw new Error('Error.');
    }

    this._status = 'done';
    this.emitStatus();

    await this.metastable.storage.config.set('python', {
      configured: true,
      mode: 'static',
      pythonHome: this._pythonHome
        ? path.relative(this.metastable.storage.dataRoot, this._pythonHome)
        : undefined,
      packagesDir: this._packagesDir
        ? path.relative(this.metastable.storage.dataRoot, this._packagesDir)
        : undefined,
    });

    const platform = os.platform();
    if (platform === 'win32' && this.settings.torchMode === 'amd') {
      await this.metastable.storage.config.set('comfy', {
        args: ['--directml'],
      });
    } else if (platform === 'darwin' && os.arch() === 'arm64') {
      await this.metastable.storage.config.set('comfy', {
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

    const uvTargetPath = path.join(this.metastable.storage.dataRoot, 'uv');

    const targetPath = path.join(this.metastable.storage.dataRoot, 'python');
    this._packagesDir = undefined;
    this._pythonHome = targetPath;
    setupQueue.add(new DownloadPythonTask(this.metastable.storage.dataRoot));
    setupQueue.add(
      new ConfigurePythonTask(
        settings.torchMode,
        uvTargetPath,
        undefined,
        targetPath,
      ),
    );

    if (settings.downloads.length) {
      this.metastable.tasks.queues.setup.add(
        new DownloadModelsTask(this.metastable, settings.downloads),
      );
    }
  }
}

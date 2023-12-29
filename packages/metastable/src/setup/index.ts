import os from 'os';
import path from 'path';
import si from 'systeminformation';
import checkDiskSpace from 'check-disk-space';
import { EventEmitter } from 'events';
import { SetupDetails, SetupSettings, SetupStatus } from '@metastable/types';

import type { Metastable } from '../index.js';
import { getOS, getPython } from './helpers.js';
import { BaseTask } from './tasks/base.js';
import { DownloadPythonTask } from './tasks/downloadPython.js';
import { ExtractPythonTask } from './tasks/extractPython.js';
import { ConfigurePythonTask } from './tasks/configurePython.js';
import { DownloadModelsTask } from './tasks/downloadModels.js';

export class Setup extends EventEmitter {
  settings: SetupSettings | undefined = undefined;
  private _status: SetupStatus['status'] = 'required';
  private _tasks: Record<string, BaseTask> = {};
  private _pythonHome: string | undefined = undefined;
  private _packagesDir: string | undefined = undefined;

  private _checked = false;

  constructor(private metastable: Metastable) {
    super();
  }

  async status(): Promise<SetupStatus> {
    if (!this._checked) {
      const python = await this.metastable.storage.config.get('python');

      if (python?.configured) {
        this._status = 'done';
      }
    }

    return {
      status: this._status,
      tasks: Object.fromEntries(
        Object.entries(this._tasks).map(([key, value]) => [
          key,
          { log: value.log, progress: value.progress, state: value.state },
        ]),
      ),
    };
  }

  async details(): Promise<SetupDetails> {
    const graphics = await si.graphics();
    const dataRoot = this.metastable.storage.dataRoot;
    // @ts-ignore
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

  async run() {
    if (!this.settings) {
      throw new Error('Error.');
    }

    for (const value of Object.values(this._tasks)) {
      value.on('state', () => this.emitStatus());
      value.setState('in_progress');
      try {
        await value.run();
        value.setProgress(100);
        value.setState('done');
      } catch (e) {
        value.appendLog('Error: ' + String(e));
        value.setState('error');
        return;
      }
      value.removeAllListeners();
    }

    this._status = 'done';
    await this.metastable.storage.config.set('python', {
      configured: true,
      mode: this.settings.pythonMode,
      pythonHome: this._pythonHome,
      packagesDir: this._packagesDir,
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

    this.metastable.restartComfy();
  }

  async start(settings: SetupSettings) {
    if (this.settings) {
      return;
    }

    this.settings = settings;

    this._status = 'in_progress';
    const tasks: Record<string, BaseTask> = {};

    if (settings.pythonMode === 'static') {
      const archivePath = path.join(
        this.metastable.storage.dataRoot,
        'python.tar.gz',
      );
      const targetPath = path.join(this.metastable.storage.dataRoot, 'python');
      this._packagesDir = undefined;
      this._pythonHome = targetPath;
      tasks['python.download'] = new DownloadPythonTask(archivePath);
      tasks['python.extract'] = new ExtractPythonTask(archivePath, targetPath);
      tasks['python.install'] = new ConfigurePythonTask(
        settings.torchMode,
        undefined,
        targetPath,
      );
    } else {
      const packagesDir = path.join(
        this.metastable.storage.dataRoot,
        'python',
        'pip',
      );
      this._packagesDir = packagesDir;
      this._pythonHome = undefined;
      tasks['python.install'] = new ConfigurePythonTask(
        settings.torchMode,
        packagesDir,
        undefined,
      );
    }

    if (settings.downloads.length) {
      tasks['models.download'] = new DownloadModelsTask(
        this.metastable,
        settings.downloads,
      );
    }

    this._tasks = tasks;
    this.emitStatus();
    this.run();
  }
}

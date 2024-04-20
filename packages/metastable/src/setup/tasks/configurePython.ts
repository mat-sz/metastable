import os from 'os';
import path from 'path';

import { SetupSettings, TaskState } from '@metastable/types';
import { spawn } from 'node-pty';

import { WrappedPromise } from '../../helpers/promise.js';
import { PythonInstance } from '../../python/index.js';
import { BaseTask } from '../../tasks/task.js';
import { requiredPackages } from '../helpers.js';

export class ConfigurePythonTask extends BaseTask {
  constructor(
    private torchMode: SetupSettings['torchMode'],
    private pythonHome: string,
  ) {
    super('python.configure', undefined);
  }

  async execute() {
    let required: string[] = requiredPackages.map(pkg => {
      let dependency = pkg.name;
      if (pkg.extra) {
        dependency += `[${pkg.extra}]`;
      }
      if (pkg.version) {
        dependency += pkg.version;
      }
      return dependency;
    });

    const python = await PythonInstance.fromDirectory(this.pythonHome);
    let extraIndexUrl: string | undefined = undefined;
    const platform = os.platform();

    switch (platform) {
      case 'win32':
        switch (this.torchMode) {
          case 'nvidia':
            extraIndexUrl = 'https://download.pytorch.org/whl/cu121';
            break;
          case 'amd':
            required = required.map(pkg =>
              pkg === 'torch' ? 'torch-directml' : pkg,
            );
            break;
        }
        break;
      case 'darwin':
        extraIndexUrl = 'https://download.pytorch.org/whl/nightly/cpu';
        break;
      case 'linux':
        switch (this.torchMode) {
          case 'nvidia':
            extraIndexUrl = 'https://download.pytorch.org/whl/cu121';
            break;
          case 'amd':
            extraIndexUrl = 'https://download.pytorch.org/whl/nightly/rocm5.7';
            break;
          default:
            extraIndexUrl = 'https://download.pytorch.org/whl/cpu';
        }
        break;
    }

    const uvBin =
      os.platform() === 'win32'
        ? path.join(this.pythonHome, 'uv.exe')
        : path.join(this.pythonHome, 'bin', 'uv');

    const proc = spawn(
      uvBin,
      [
        'pip',
        'install',
        '--python',
        python.path,
        ...(extraIndexUrl ? ['--extra-index-url', extraIndexUrl] : []),
        ...required,
      ],
      {
        env: process.env,
      },
    );

    const wrapped = new WrappedPromise<TaskState>();
    proc.onData(data => {
      const matches = data.match(/\[(\d+)\/(\d+)\] ([\w\s.=-]+(\s{2}|\x1b))/g);
      if (matches?.length) {
        const last = matches.pop()!;
        const split = last.split('] ');
        const [value, max] = split[0]
          .substring(1)
          .split('/')
          .map(value => parseInt(value));
        this.progress = value / (max || 1);
        this.appendLog(`[${value}/${max}]: ${split[1].trim()}`);
      }
    });

    proc.onExit(({ exitCode }) => {
      if (exitCode !== 0) {
        wrapped.reject(
          new Error(`Process exited with non-zero exit code: ${exitCode}`),
        );
      } else {
        wrapped.resolve(TaskState.SUCCESS);
      }
    });

    return await wrapped.promise;
  }
}

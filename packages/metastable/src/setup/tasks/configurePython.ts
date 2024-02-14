import os from 'os';
import { spawn } from 'child_process';
import { SetupSettings, TaskState } from '@metastable/types';

import { PythonInstance } from '../../python/index.js';
import { requiredPackages } from '../helpers.js';
import { BaseTask } from '../../tasks/task.js';
import { WrappedPromise } from '../../helpers/promise.js';

export class ConfigurePythonTask extends BaseTask {
  constructor(
    private torchMode: SetupSettings['torchMode'],
    private packagesDir?: string,
    private pythonHome?: string,
  ) {
    super('python.configure', undefined);
  }

  async execute() {
    let collecting: string[] = [];
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

    const python = this.pythonHome
      ? await PythonInstance.fromDirectory(this.pythonHome)
      : await PythonInstance.fromSystem();

    const env = {
      PYTHONHOME: this.pythonHome!,
      PYTHONPATH: this.packagesDir!,
      FORCE_COLOR: '1',
    };

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

    const proc = spawn(
      python.path,
      [
        '-m',
        'pip',
        'install',
        ...(this.packagesDir ? ['--target', this.packagesDir] : []),
        ...(extraIndexUrl ? ['--extra-index-url', extraIndexUrl] : []),
        '--disable-pip-version-check',
        '--no-input',
        ...required,
      ],
      {
        env,
      },
    );

    const wrapped = new WrappedPromise<TaskState>();
    wrapped.on('finish', () => {
      proc.kill('SIGTERM');
    });

    const PIP_PROGRESS_STARTS_WITH = [
      'Collecting ',
      'Requirement already satisfied: ',
    ];
    proc.stdout.on('data', chunk => {
      const trimmed = chunk.toString().trim();
      if (PIP_PROGRESS_STARTS_WITH.find(item => trimmed.startsWith(item))) {
        let name = trimmed;
        for (const item of PIP_PROGRESS_STARTS_WITH) {
          name = name.replace(item, '');
        }
        name = name.split(' ')[0];
        if (name && required.includes(name)) {
          collecting.push(name);

          // TODO: Can't think of anything better.
          if (collecting.length === 1) {
            this.progress = 0.05;
          } else {
            this.progress = Math.min(
              (collecting.length - 1) / required.length,
              90,
            );
          }
        }
      }

      if (trimmed.startsWith('\u001b[2K')) {
        const currentPackage = collecting[collecting.length - 1];
        if (currentPackage) {
          const split = trimmed
            .split('\u001b[32m')[1]
            ?.split(' ')[0]
            ?.split('/');
          const progress = split
            ? parseFloat(split[0]) / parseFloat(split[1])
            : 0;
          this.progress = Math.min(
            (collecting.length - 1) / required.length +
              progress / required.length,
            0.9,
          );
        }
      }

      this.appendLog(chunk.toString().trimEnd());
    });
    proc.stderr.on('data', chunk => {
      this.appendLog(chunk.toString().trimEnd());
    });

    proc.on('exit', code => {
      if (code !== 0) {
        wrapped.reject(
          new Error(`Process exited with non-zero exit code: ${code}`),
        );
      } else {
        wrapped.resolve(TaskState.SUCCESS);
      }
    });
    proc.on('error', err => {
      wrapped.reject(err);
    });

    return await wrapped.promise;
  }
}

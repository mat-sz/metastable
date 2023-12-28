import semver from 'semver';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import si from 'systeminformation';
import checkDiskSpace from 'check-disk-space';
import { EventEmitter } from 'events';
import {
  Requirement,
  SetupDetails,
  SetupOS,
  SetupPython,
  SetupSettings,
  SetupStatus,
  SetupTask,
} from '@metastable/types';
import {
  PromiseWrapper,
  PythonInstance,
  getPythonDownloadUrl,
} from '@metastable/python';

import type { Metastable } from './index.js';
import { download } from '@metastable/downloader';
import decompress from 'decompress';
import { spawn } from 'child_process';
import { rimraf } from 'rimraf';
import { tryUnlink } from '@metastable/fs-helpers';

interface PipDependency {
  name: string;
  version?: string;
}

async function isGNULibc() {
  try {
    const text = await fs.readFile('/usr/bin/ldd', { encoding: 'utf8' });
    return text.includes('Free Software Foundation');
  } catch (e) {
    return false;
  }
}

const requiredPackages: PipDependency[] = [
  { name: 'torch' },
  { name: 'torchvision' },
  { name: 'torchaudio' },
  { name: 'torchsde' },
  { name: 'einops' },
  { name: 'transformers' },
  { name: 'safetensors' },
  { name: 'accelerate' },
  { name: 'pyyaml' },
  { name: 'Pillow' },
  { name: 'scipy' },
  { name: 'tqdm' },
  { name: 'psutil' },
];

const REQUIRED_PYTHON_VERSION = '3.8.0 - 3.11.x';

async function getOS(): Promise<SetupOS> {
  const platform = os.platform();
  const release = os.release();
  let platformCompatible = false;
  let versionCompatible = false;
  let isGlibc: boolean | undefined = undefined;
  let supportedArchitectures: string[] = [];

  switch (platform) {
    case 'linux':
      platformCompatible = true;
      versionCompatible = true;
      supportedArchitectures = ['x64'];
      isGlibc = await isGNULibc();
      break;
    case 'darwin':
      platformCompatible = true;
      versionCompatible = semver.satisfies(os.release(), '>=10.9');
      supportedArchitectures = ['x64', 'arm64'];
      break;
    case 'win32':
      platformCompatible = true;
      versionCompatible = semver.satisfies(os.release(), '>=10.0');
      supportedArchitectures = ['x64'];
      break;
  }

  const arch = os.arch();
  const architectureCompatible = supportedArchitectures.includes(arch);

  return {
    version: {
      value: release,
      compatible: versionCompatible,
    },
    platform: {
      value: platform,
      compatible: platformCompatible,
    },
    architecture: {
      value: arch,
      supported: supportedArchitectures,
      compatible: architectureCompatible,
    },
    isGlibc,
  };
}

async function getPython(python?: PythonInstance): Promise<SetupPython> {
  const noPython = {
    required: REQUIRED_PYTHON_VERSION,
    compatible: false,
    hasPip: false,
  };
  if (!python) {
    return noPython;
  }

  try {
    const version = await python.version();
    const compatible = semver.satisfies(
      version.version,
      REQUIRED_PYTHON_VERSION,
    );

    let packageVersions: Record<string, string | null> = {};

    if (compatible && python) {
      try {
        packageVersions = await python.packages(
          requiredPackages.map(pkg => pkg.name),
        );
      } catch {}
    }

    const requirements: Requirement[] = [];
    for (const pkg of requiredPackages) {
      const version = packageVersions[pkg.name];

      requirements.push({
        name: pkg.name,
        expected: pkg.version || 'any',
        actual: version || 'Not installed',
        satisfied: version
          ? pkg.version
            ? semver.satisfies(version, pkg.version)
            : true
          : false,
      });
    }

    const hasPip = await python.hasPip();
    return {
      hasPip,
      version: version.version,
      required: REQUIRED_PYTHON_VERSION,
      compatible: compatible && hasPip,
      requirements,
    };
  } catch {
    return noPython;
  }
}

class BaseTask extends EventEmitter {
  log: string = '';
  state: SetupTask['state'] = 'queued';
  progress: number = 0;

  async run(): Promise<void> {
    throw new Error('Not implemented');
  }

  appendLog(data: string) {
    if (data.startsWith('\r')) {
      this.log = this.log.substring(0, this.log.lastIndexOf('\n'));
    }

    data = data.replace('\r', '');
    this.log += !this.log ? data : `\n${data}`;
    this.emit('state');
  }

  setState(state: SetupTask['state']) {
    this.state = state;
    this.emit('state');
  }

  setProgress(progress: number) {
    this.progress = progress;
    this.emit('state');
  }
}

class DownloadPythonTask extends BaseTask {
  constructor(private archivePath: string) {
    super();
  }

  async run() {
    tryUnlink(this.archivePath);
    this.appendLog('Getting download URL.');
    const url = await getPythonDownloadUrl();
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.archivePath}`);

    await download(url, this.archivePath, task => {
      this.setProgress((task.progress / task.size) * 100);
    });

    this.appendLog('Done.');
  }
}

class ExtractPythonTask extends BaseTask {
  constructor(
    private archivePath: string,
    private targetPath: string,
  ) {
    super();
  }

  async run() {
    this.appendLog('Cleaning up...');
    try {
      await rimraf(this.targetPath);
    } catch {}

    this.appendLog(`Extracting ${this.archivePath} to ${this.targetPath}`);

    await decompress(this.archivePath, this.targetPath, { strip: 1 });
    tryUnlink(this.archivePath);

    this.appendLog('Done.');
  }
}

class InstallPythonTask extends BaseTask {
  constructor(
    private torchMode: SetupSettings['torchMode'],
    private packagesDir?: string,
    private pythonHome?: string,
  ) {
    super();
  }

  async run() {
    let collecting: string[] = [];
    let required: string[] = requiredPackages.map(pkg =>
      pkg.version ? `${pkg.name}${pkg.version}` : `${pkg.name}`,
    );

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

    const wrapped = new PromiseWrapper<void>();
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
            this.setProgress(5);
          } else {
            this.setProgress(
              Math.min(((collecting.length - 1) / required.length) * 100, 90),
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
          this.setProgress(
            Math.min(
              ((collecting.length - 1) / required.length +
                progress / required.length) *
                100,
              90,
            ),
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
        wrapped.resolve();
      }
    });
    proc.on('error', err => {
      wrapped.reject(err);
    });

    return await wrapped.promise;
  }
}

class DownloadModelsTask extends BaseTask {
  constructor(
    private metastable: Metastable,
    private downloads: SetupSettings['downloads'],
  ) {
    super();
  }

  async run() {
    this.appendLog('Will continue your downloads to download manager.');
    for (const download of this.downloads) {
      this.metastable.downloadModel(download);
    }
  }
}

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
      tasks['python.install'] = new InstallPythonTask(
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
      tasks['python.install'] = new InstallPythonTask(
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

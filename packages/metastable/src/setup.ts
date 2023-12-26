import semver from 'semver';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import si from 'systeminformation';
import disk from 'diskusage';
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
  { name: 'transformers', version: '>=4.25.1' },
  { name: 'safetensors', version: '>=0.3.0' },
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

async function getPython(
  python?: PythonInstance,
): Promise<SetupPython | undefined> {
  if (!python) {
    return undefined;
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
    return undefined;
  }
}

class BaseTask extends EventEmitter {
  log: string = '';
  state: SetupTask['state'] = 'queued';
  progress: number = 0;

  async run(): Promise<void> {
    throw new Error('Nto implemented');
  }

  appendLog(data: string) {
    this.log += `\n${data}`;
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
    this.appendLog('Done.');
  }
}

class InstallPythonTask extends BaseTask {
  constructor(
    private packagesDir: string,
    private pythonHome?: string,
  ) {
    super();
  }

  async run() {
    const proc = spawn(
      this.pythonHome ? path.join(this.pythonHome, 'bin', 'pip3') : 'pip3',
      [
        'install',
        '--target',
        this.packagesDir,
        '--extra-index-url',
        'https://download.pytorch.org/whl/cu121',
        ...requiredPackages.map(pkg =>
          pkg.version ? `${pkg.name}${pkg.version}` : `${pkg.name}`,
        ),
      ],
      {
        env: { PYTHONHOME: this.pythonHome, PYTHONPATH: this.packagesDir },
      },
    );

    const wrapped = new PromiseWrapper<void>();
    wrapped.on('finish', () => {
      proc.kill('SIGTERM');
    });

    proc.stdout.on('data', chunk => {
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

  constructor(private metastable: Metastable) {
    super();
  }

  async status(): Promise<SetupStatus> {
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

    return {
      os: await getOS(),
      graphics: graphics.controllers.map(item => ({
        vendor: item.vendor,
        vram: item.vram ? item.vram * 1024 * 1024 : undefined,
      })),
      python: await getPython(this.metastable.python),
      storage: {
        dataRoot,
        ...(await disk.check(dataRoot)),
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
      }
      value.removeAllListeners();
    }
  }

  async start(settings: SetupSettings) {
    if (this.settings) {
      return;
    }

    this.settings = settings;

    this._status = 'in_progress';
    const tasks: Record<string, BaseTask> = {};

    const packagesDir = path.join(
      this.metastable.storage.dataRoot,
      'python',
      'pip',
    );
    let pythonHome: string | undefined = undefined;

    if (settings.pythonMode === 'static') {
      const archivePath = path.join(
        this.metastable.storage.dataRoot,
        'python.tar.gz',
      );
      const targetPath = path.join(this.metastable.storage.dataRoot, 'python');
      pythonHome = targetPath;
      tasks['python.download'] = new DownloadPythonTask(archivePath);
      tasks['python.extract'] = new ExtractPythonTask(archivePath, targetPath);
    }
    tasks['python.install'] = new InstallPythonTask(packagesDir, pythonHome);

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

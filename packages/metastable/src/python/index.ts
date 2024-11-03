import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

import which from 'which';

import { stdout } from '../helpers/spawn.js';

const PYTHON_COMMANDS = [
  'python3.11',
  'python3.10',
  'python3.9',
  'python3.8',
  'python3',
  'python',
];

async function getPythonCommand() {
  for (const command of PYTHON_COMMANDS) {
    const binPath = await which(command, { nothrow: true });
    if (binPath) {
      return binPath;
    }
  }

  return undefined;
}

const PYTHON_PACKAGES = `
import importlib.metadata
import json

distributions = importlib.metadata.distributions()
installed_packages = []
for dist in distributions:
  args = (dist.metadata['Name'], dist.version)
  installed_packages.append(args)

installed_packages.sort()
output = {}

for package_name, version in installed_packages:
  output[package_name] = version

print(json.dumps(output))
`;

export class PythonInstance {
  public packages: Record<string, string | undefined> = {};

  constructor(
    public path: string,
    public pythonHome?: string,
    private packagesDir?: string,
  ) {}

  private get env() {
    const env: Record<string, string> = {};

    if (this.packagesDir) {
      env.PYTHONPATH = this.packagesDir;
    }

    if (this.pythonHome) {
      env.PYTHONHOME = this.pythonHome;
      env.PYTHONNOUSERSITE = 'true';
    }

    return env;
  }

  spawn(args: string[], env?: Record<string, string>) {
    const proc = spawn(this.path, ['-u', ...args], {
      cwd: process.cwd(),
      detached: true,
      env: {
        ...process.env,
        ...this.env,
        ...env,
      },
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
    });

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');

    return proc;
  }

  private async stdout(args: string[], onLog?: (data: string) => void) {
    return await stdout(this.path, ['-u', ...args], {
      env: { ...process.env, ...this.env },
      onLog,
      timeout: undefined,
    });
  }

  private async runPython(code: string) {
    return JSON.parse(await this.stdout(['-c', code]));
  }

  async refreshPackages(): Promise<void> {
    this.packages = await this.runPython(PYTHON_PACKAGES);
  }

  async pipInstall(packages: string[], onLog?: (data: string) => void) {
    await this.stdout(['-m', 'pip', 'install', ...packages], onLog);
  }

  static async fromDirectory(dir: string, packagesDir?: string) {
    dir = path.resolve(dir);
    const pythonBin =
      os.platform() === 'win32'
        ? path.join(dir, 'python.exe')
        : path.join(dir, 'bin', 'python3');

    return new PythonInstance(pythonBin, dir, packagesDir);
  }

  static async fromSystem(packagesDir?: string) {
    const cmd = await getPythonCommand();
    if (!cmd) {
      throw new Error('Unable to locate a compatible Python instance.');
    }

    return new PythonInstance(cmd, undefined, packagesDir);
  }
}

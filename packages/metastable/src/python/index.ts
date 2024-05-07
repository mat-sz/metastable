import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

import which from 'which';

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

export class PythonInstance {
  constructor(
    public path: string,
    private pythonHome?: string,
    private packagesDir?: string,
  ) {}

  private get env() {
    const env: Record<string, string> = {};

    if (this.packagesDir) {
      env.PYTHONPATH = this.packagesDir;
    }

    if (this.pythonHome) {
      env.PYTHONHOME = this.pythonHome;
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

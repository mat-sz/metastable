import which from 'which';
import { spawn } from 'child_process';
import path from 'path';

import { stdout } from './spawn.js';

const PYTHON_COMMANDS = [
  'python3.11',
  'python3.10',
  'python3.9',
  'python3.8',
  'python3',
  'python',
];

async function hasCommand(name: string) {
  return !!(await which(name, { nothrow: true }));
}

async function getPythonCommand() {
  for (const command of PYTHON_COMMANDS) {
    if (await hasCommand(command)) {
      return command;
    }
  }

  return undefined;
}

interface PythonVersion {
  tag: { interpreter: string; abi: string; platform: string };
  version: string;
}

const PYTHON_VERSION = `
from packaging.tags import sys_tags
from platform import python_version
import json

tag = next(sys_tags())

print(json.dumps({
  "tag": {
    "interpreter": tag.interpreter,
    "abi": tag.abi,
    "platform": tag.platform
  },
  "version": python_version()
}))
`;

const PYTHON_PACKAGES = `
from importlib.metadata import version
import json

names = %NAMES
output = {}

for name in names:
  try:
    output[name] = version(name)
  except:
    output[name] = None

print(json.dumps(output))
`;

export class PythonInstance {
  constructor(
    private path: string,
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

  spawn(args: string[]) {
    const proc = spawn(this.path, ['-u', ...args], {
      cwd: process.cwd(),
      detached: true,
      env: {
        ...process.env,
      },
    });

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');

    return proc;
  }

  private async stdout(args: string[]) {
    return await stdout(this.path, ['-u', ...args], this.env);
  }

  private async runPython(code: string) {
    return JSON.parse(await this.stdout(['-c', code]));
  }

  async version(): Promise<PythonVersion> {
    return await this.runPython(PYTHON_VERSION);
  }

  async packages(names: string[]): Promise<Record<string, string | null>> {
    return await this.runPython(
      PYTHON_PACKAGES.replace('%NAMES', JSON.stringify(names)),
    );
  }

  static async fromDirectory(dir: string, packagesDir?: string) {
    dir = path.resolve(dir);
    const instance = new PythonInstance(
      path.join(dir, 'bin', 'python3'),
      dir,
      packagesDir,
    );

    // Ensure everything works.
    await instance.version();

    return instance;
  }

  static async fromSystem(packagesDir?: string) {
    const cmd = await getPythonCommand();
    if (!cmd) {
      throw new Error('Unable to locate a compatible Python instance.');
    }

    return new PythonInstance(cmd, undefined, packagesDir);
  }
}

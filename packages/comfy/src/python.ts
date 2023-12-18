import which from 'which';
import { spawn } from 'child_process';

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

const PYTHON_TAGS = `
from packaging.tags import sys_tags
import json

print(json.dumps(
  ["{0}-{1}-{2}".format(tag.interpreter, tag.abi, tag.platform) for tag in sys_tags()]
))
`;

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
    private packagesPath?: string,
  ) {}

  private get env() {
    const env: Record<string, string> = {};

    if (this.packagesPath) {
      env.PYTHONPATH = this.packagesPath;
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

  async tags(): Promise<string[]> {
    return await this.runPython(PYTHON_TAGS);
  }

  async version(): Promise<PythonVersion> {
    return await this.runPython(PYTHON_VERSION);
  }

  async packages(names: string[]): Promise<Record<string, string | null>> {
    return await this.runPython(
      PYTHON_PACKAGES.replace('%NAMES', JSON.stringify(names)),
    );
  }
}

export async function createPythonInstance(path?: string) {
  if (!path) {
    path = await getPythonCommand();
  }

  if (!path) {
    throw new Error('Unable to locate a compatible python instance.');
  }

  const python = new PythonInstance(path);

  return python;
}

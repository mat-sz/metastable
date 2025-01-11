import fs from 'fs/promises';
import os from 'os';

import { SetupOS } from '@metastable/types';
import semver from 'semver';

export async function isGNULibc() {
  try {
    const text = await fs.readFile('/usr/bin/ldd', { encoding: 'utf8' });
    return text.includes('Free Software Foundation');
  } catch {
    return false;
  }
}

export const REQUIRED_PYTHON_VERSION = '3.8.0 - 3.11.x';

export async function getOS(): Promise<SetupOS> {
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

const LINUX_X86_64_VERSION_FLAGS = {
  v2: ['cx16', 'lahf_lm', 'popcnt', 'sse4_1', 'sse4_2', 'ssse3'],
  v3: ['avx', 'avx2', 'bmi1', 'bmi2', 'f16c', 'fma', 'abm', 'movbe', 'xsave'],
  v4: ['avx512f', 'avx512bw', 'avx512cd', 'avx512dq', 'avx512vl'],
};

export async function getLinuxArchitecture(simple = false) {
  if (os.arch() !== 'x64') {
    return undefined;
  }

  if (simple) {
    return 'x86_64';
  }

  const cpuInfo = await fs.readFile('/proc/cpuinfo', { encoding: 'utf-8' });
  const split = cpuInfo.split('\n');
  const line = split.find(line => line.startsWith('flags'));
  if (!line) {
    return undefined;
  }

  const flags = line.split(':')[1]?.trim().split(' ');
  if (!flags) {
    return undefined;
  }

  let archVersion = '';
  for (const [version, versionFlags] of Object.entries(
    LINUX_X86_64_VERSION_FLAGS,
  )) {
    let allFound = true;
    for (const flag of versionFlags) {
      if (!flags.includes(flag)) {
        allFound = false;
        break;
      }
    }

    if (allFound) {
      archVersion = version;
    }
  }

  return archVersion ? `x86_64_${archVersion}` : `x86_64`;
}

export async function getPlatform(simple = false) {
  const platform = os.platform();
  if (platform === 'darwin') {
    if (os.arch() === 'arm64') {
      return 'aarch64-apple-darwin';
    } else if (os.arch() === 'x64') {
      return 'x86_64-apple-darwin';
    }
  } else if (platform === 'win32' && os.arch() === 'x64') {
    return `x86_64-pc-windows-msvc${simple ? '' : '-shared'}`;
  } else if (platform === 'linux') {
    const arch = await getLinuxArchitecture(simple);
    if (!arch) {
      throw new Error(`Unsupported architecture: ${os.arch()}`);
    }

    return `${arch}-unknown-linux-gnu`;
  }

  throw new Error(`Unsupported platform: ${platform} ${os.arch()}`);
}

export async function getBundleInfo(bundleName: string, fileName: string) {
  try {
    const res = await fetch(
      `https://bundles.metastable.studio/${bundleName}/version.json`,
    );
    const info = (await res.json()) as { version: string };
    return {
      ...info,
      url: `https://bundles.metastable.studio/${bundleName}/${info.version}/${fileName}`,
    };
  } catch (e) {
    throw new Error(`Unable to information for bundle ${bundleName}, ${e}`);
  }
}

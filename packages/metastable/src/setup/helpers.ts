import semver from 'semver';
import os from 'os';
import fs from 'fs/promises';
import { Requirement, SetupOS, SetupPython } from '@metastable/types';

import { PythonInstance } from '../python/index.js';
import { PipDependency } from './types.js';

export async function isGNULibc() {
  try {
    const text = await fs.readFile('/usr/bin/ldd', { encoding: 'utf8' });
    return text.includes('Free Software Foundation');
  } catch (e) {
    return false;
  }
}

export const requiredPackages: PipDependency[] = [
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

export async function getPython(python?: PythonInstance): Promise<SetupPython> {
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

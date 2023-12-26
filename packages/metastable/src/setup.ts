import semver from 'semver';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import si from 'systeminformation';
import disk from 'diskusage';
import { Requirement } from '@metastable/types';
import { PythonInstance } from '@metastable/python';

import type { Metastable } from './index.js';

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

async function getOS() {
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

async function getPython(python?: PythonInstance) {
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

    return {
      version: version.version,
      required: REQUIRED_PYTHON_VERSION,
      compatible,
      requirements,
    };
  } catch {
    return undefined;
  }
}

async function osRequirements() {
  return [];
}

async function pythonRequirements(python?: PythonInstance) {
  const requirements: Requirement[] = [];

  const pythonRequirement = {
    name: 'Python',
    expected: REQUIRED_PYTHON_VERSION,
    actual: 'Not installed',
    satisfied: false,
  };

  let isPython38OrNewer = false;
  if (python) {
    try {
      const version = await python.version();
      pythonRequirement.actual = version.version;
      pythonRequirement.satisfied = semver.satisfies(
        version.version,
        REQUIRED_PYTHON_VERSION,
      );

      if (semver.satisfies(version.version, '>=3.8.0')) {
        isPython38OrNewer = true;
      }
    } catch {}
  }

  requirements.push(pythonRequirement);

  // let packageVersions: Record<string, string | null> = {};

  // if (isPython38OrNewer && python) {
  //   try {
  //     packageVersions = await python.packages(
  //       requiredPackages.map(pkg => pkg.name),
  //     );
  //   } catch {}
  // }

  // for (const pkg of requiredPackages) {
  //   const version = packageVersions[pkg.name];

  //   requirements.push({
  //     name: pkg.name,
  //     expected: pkg.version || 'any',
  //     actual: version || 'Not installed',
  //     satisfied: version
  //       ? pkg.version
  //         ? semver.satisfies(version, pkg.version)
  //         : true
  //       : false,
  //   });
  // }

  return requirements;
}

export class Setup {
  constructor(private metastable: Metastable) {}

  async info() {
    return {
      required: false,
    };
  }

  async details() {
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
      // python
      // pip
      // storage space
      // gpu + vram
    };
  }

  async requirements() {
    return [
      ...(await osRequirements()),
      ...(await pythonRequirements(this.metastable.python)),
    ];
  }
}

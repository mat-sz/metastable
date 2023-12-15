import semver from 'semver';
import os from 'os';
import { Requirement } from '@metastable/types';

import type { PythonInstance } from './python.js';

interface PipDependency {
  name: string;
  version?: string;
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

function getOS() {
  let name = `${os.platform()} ${os.release()}`;
  let satisfied = false;
  let supportedArchs: string[] = [];

  switch (os.platform()) {
    case 'linux':
      name = 'Linux';
      satisfied = true;
      supportedArchs = ['x64'];
      break;
    case 'darwin':
      name = `macOS ${os.release()}`;
      satisfied = semver.satisfies(os.release(), '>=10.9');
      supportedArchs = ['x64', 'arm64'];
      break;
    case 'win32':
      name = `Windows ${os.release()}`;
      satisfied = semver.satisfies(os.release(), '>=10.0');
      supportedArchs = ['x64'];
      break;
  }

  return { name, satisfied, supportedArchs };
}

export async function validateRequirements(python?: PythonInstance) {
  const requirements: Requirement[] = [];

  const osinfo = getOS();

  requirements.push({
    name: 'Operating System',
    expected: 'Windows 10.0+, macOS 10.9+, Linux',
    actual: osinfo.name,
    satisfied: osinfo.satisfied,
    type: 'os',
  });
  requirements.push({
    name: 'CPU Architecture',
    expected: osinfo.supportedArchs.join(', '),
    actual: os.arch(),
    satisfied: osinfo.supportedArchs.includes(os.arch()),
    type: 'os',
  });

  const pythonRequirement = {
    name: 'Python',
    expected: REQUIRED_PYTHON_VERSION,
    actual: 'Not installed',
    satisfied: false,
    type: 'python',
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

  let packageVersions: Record<string, string | null> = {};

  if (isPython38OrNewer && python) {
    try {
      packageVersions = await python.packages(
        requiredPackages.map(pkg => pkg.name),
      );
    } catch {}
  }

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
      type: 'python',
    });
  }

  return requirements;
}

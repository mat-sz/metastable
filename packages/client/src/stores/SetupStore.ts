import { makeAutoObservable, runInAction } from 'mobx';
import { Requirement } from '@metastable/types';

import { API } from '../api';
import { filesize } from '../helpers';
import { DownloadFile } from '../types/model';

const GB = 1024 * 1024 * 1024;
const VRAM_MIN = 2 * GB;
const VRAM_RECOMMENDED = 6 * GB;
const STORAGE_MIN = 16 * GB;
const STORAGE_RECOMMENDED = 64 * GB;

interface SetupItemState {
  description: string;
  status: 'incomplete' | 'ok' | 'warning' | 'error';
  requirements: Requirement[];
  storage?: number;
}

export class SetupStore {
  details: any = undefined;
  selected: string | undefined = undefined;

  pythonMode: 'system' | 'static' = 'static';
  downloads: DownloadFile[] = [];

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    const details = await API.setup.details();
    runInAction(() => {
      this.details = details;
    });
  }

  get requirements() {
    return [
      ...this.os.requirements,
      ...this.hardware.requirements,
      ...this.python.requirements,
      ...this.storage.requirements,
    ];
  }

  get os(): SetupItemState {
    if (!this.details) {
      return {
        description: 'Something went wrong.',
        status: 'error',
        requirements: [],
      };
    }

    let description = 'Great! Your operating system is compatible.';
    let status: SetupItemState['status'] = 'ok';

    const os = this.details.os;

    let name = `${os.platform.value} ${os.version.value}`;
    const extraRequirements: Requirement[] = [];

    switch (os.platform.value) {
      case 'linux':
        name = `Linux ${os.version.value}`;

        {
          extraRequirements.push({
            name: 'GNU libc',
            expected: true,
            actual: os.isGlibc,
            satisfied: !!os.isGlibc,
          });

          if (!os.isGlibc) {
            status = 'error';
            description = 'GNU libc is required to run Metastable.';
          }
        }
        break;
      case 'darwin':
        name = `macOS ${os.version.value}`;
        break;
      case 'win32':
        name = `Windows ${os.version.value}`;
        break;
    }

    const requirements: Requirement[] = [];
    requirements.push({
      name: 'Operating System',
      expected: 'Windows 10.0+, macOS 10.9+, Linux',
      actual: name,
      satisfied: os.platform.compatible && os.version.compatible,
    });
    requirements.push({
      name: 'CPU Architecture',
      expected: os.architecture.supported.join(', '),
      actual: os.architecture.value,
      satisfied: os.architecture.compatible,
    });
    requirements.push(...extraRequirements);

    if (!os.version.compatible) {
      status = 'error';
      description = 'Your operating system is out of date.';
    } else if (!os.platform.compatible) {
      status = 'error';
      description = 'Your operating system is not supported.';
    }

    return {
      description,
      status,
      requirements,
    };
  }

  get hardware(): SetupItemState {
    if (!this.details) {
      return {
        description: 'Something went wrong.',
        status: 'error',
        requirements: [],
      };
    }

    let description = 'Great! Your computer is compatible.';
    let status: SetupItemState['status'] = 'ok';

    const requirements: Requirement[] = [];

    const vendor = this.details.graphics[0]?.vendor;
    const vram = this.details.graphics[0]?.vram;
    const humanVram = vram ? filesize(vram) : 'not available';

    requirements.push({
      name: 'GPU Vendor',
      expected: 'NVIDIA',
      actual: vendor,
      satisfied: vendor.includes('NVIDIA'),
    });
    requirements.push({
      name: 'GPU VRAM',
      expected: `>= ${filesize(VRAM_RECOMMENDED)}`,
      actual: humanVram,
      satisfied: vram > VRAM_RECOMMENDED,
    });

    if (!vendor) {
      description = 'A GPU is required for an optimal user experience.';
      status = 'error';
    } else if (vram < VRAM_MIN) {
      description = `Current amount of VRAM (${humanVram}) is lower than the minimum required (${filesize(
        VRAM_MIN,
      )}).`;
      status = 'error';
    } else if (vram < VRAM_RECOMMENDED) {
      description = `Current amount of VRAM (${humanVram}) is lower than the recommended amount (${filesize(
        VRAM_RECOMMENDED,
      )}).`;
      status = 'warning';
    } else if (!vendor.includes('NVIDIA')) {
      description = `Non-NVIDIA GPUs haven't been tested, but should work correctly.`;
      status = 'warning';
    }

    return {
      description,
      status,
      requirements,
    };
  }

  get python(): SetupItemState {
    if (!this.details) {
      return {
        description: 'Something went wrong.',
        status: 'error',
        requirements: [],
      };
    }

    let description = `We'll install and configure Python for you.`;
    let status: SetupItemState['status'] = 'ok';
    const requirements: Requirement[] = [];
    const python = this.details.python;
    if (python) {
      requirements.push({
        name: 'python',
        expected: python.required,
        actual: python.version,
        satisfied: python.compatible,
      });
      requirements.push({
        name: 'pip',
        expected: true,
        actual: python.hasPip,
        satisfied: python.hasPip,
      });
      requirements.push(...python.requirements);

      if (this.pythonMode === 'static') {
        description = `Python ${python.version} is installed, but we'll install and configure a separate instance.`;
      } else if (python.compatible) {
        description = `We'll use the system-wide Python ${python.version} installation.`;
      } else {
        description = `You've chosen to use an incompatible system Python installation.`;
        status = 'error';
      }
    } else {
      requirements.push({
        name: 'python',
        expected: python.required,
        actual: 'unavailable',
        satisfied: false,
      });
      requirements.push({
        name: 'pip',
        expected: true,
        actual: false,
        satisfied: false,
      });

      if (this.pythonMode === 'system') {
        description = `You've chosen to use an unavailable system Python installation.`;
        status = 'error';
      }
    }

    return {
      description,
      status,
      requirements,
    };
  }

  get storage(): SetupItemState {
    if (!this.details) {
      return {
        description: 'Something went wrong.',
        status: 'error',
        requirements: [],
      };
    }

    const storage = this.details.storage;
    const free = storage.free;
    const humanFree = filesize(free);

    let description = `You have around ${humanFree} of free space left. That's more than enough!`;
    let status: SetupItemState['status'] = 'ok';

    const min = Math.max(this.predictedStorage.total, STORAGE_MIN);
    const recommended = Math.max(min + STORAGE_MIN, STORAGE_RECOMMENDED);

    if (free < min) {
      description = `A minimum of ${filesize(min)} of free space is required.`;
      status = 'error';
    } else if (free < recommended) {
      description = `For optimal performance, ${filesize(
        recommended,
      )} of free space is recommended.`;
      status = 'warning';
    }

    return {
      description,
      status,
      requirements: [],
    };
  }

  get models(): SetupItemState {
    if (!this.details) {
      return {
        description: 'Something went wrong.',
        status: 'error',
        requirements: [],
      };
    }

    let description = `Select models to download and install.`;
    let status: SetupItemState['status'] = 'incomplete';
    const storage = this.downloads.reduce(
      (total, file) => total + (file.size || 0),
      0,
    );

    if (this.downloads.length > 0) {
      description = `Selected ${
        this.downloads.length
      } model(s), download size: ${filesize(storage)}`;
      status = 'ok';
    }

    return {
      description,
      status,
      requirements: [],
      storage,
    };
  }

  get predictedStorage(): { total: number; breakdown: Record<string, number> } {
    let total = 0;
    const breakdown: Record<string, number> = {};

    const pythonStorage = this.python.storage;
    if (pythonStorage) {
      total += pythonStorage;
      breakdown['Python'] = pythonStorage;
    }

    const modelsStorage = this.models.storage;
    if (modelsStorage) {
      total += modelsStorage;
      breakdown['Model downloads'] = modelsStorage;
    }

    return { total, breakdown };
  }
}

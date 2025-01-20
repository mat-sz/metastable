import {
  DownloadSettings,
  Requirement,
  SetupDetails,
  SetupStatus,
  TorchMode,
} from '@metastable/types';
import { makeAutoObservable, runInAction, toJS } from 'mobx';

import { API } from '$api';
import { filesize } from '$utils/file';

const GB = 1024 * 1024 * 1024;
const VRAM_MIN = 2 * GB;
const VRAM_RECOMMENDED = 6 * GB;
const STORAGE_MIN = 16 * GB;
const STORAGE_RECOMMENDED = 64 * GB;
const GPU_VENDORS = ['NVIDIA', 'AMD', 'Apple'];

interface SetupItemState {
  description: string;
  status: 'incomplete' | 'ok' | 'warning' | 'error';
  requirements: Requirement[];
  storage?: number;
}

class SetupStore {
  status: SetupStatus = 'required';
  details: SetupDetails | undefined = undefined;
  selected: string | undefined = undefined;

  gpuIndex: number = 0;
  downloads: DownloadSettings[] = [];
  torchMode: TorchMode = 'cpu';

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    await this.refresh();

    const details = await API.setup.details.query();
    runInAction(() => {
      this.details = details;
      this.selectGpu(0);
    });
  }

  selectGpu(index: number) {
    this.gpuIndex = index;
    this.torchMode = this.gpu?.torchModes[0] || 'cpu';
  }

  async setDataRoot(dataRoot: string) {
    const storage = await API.setup.prepareDataRoot.mutate(dataRoot);
    if (storage) {
      runInAction(() => {
        this.details = { ...this.details!, storage };
      });
    }
  }

  async refresh() {
    const status = await API.setup.status.query();

    API.setup.onStatus.subscribe(undefined, {
      onData: status => {
        runInAction(() => {
          this.status = status;
        });
      },
    });

    runInAction(() => {
      this.status = status;
    });
  }

  start() {
    API.setup.start.mutate({
      downloads: toJS(this.downloads),
      torchMode: this.torchMode,
      dataRoot: this.details!.storage.path,
    });
  }

  get gpu() {
    return this.details?.gpus[this.gpuIndex];
  }

  get requirements() {
    return [
      ...this.os.requirements,
      ...this.hardware.requirements,
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

    let description = 'Your operating system is compatible.';
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
            actual: !!os.isGlibc,
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

    const requirements: Requirement[] = [];

    const gpu = this.gpu;
    if (!gpu) {
      return {
        description:
          'Unable to detect a GPU. CPU inference will be used instead.',
        status: 'error',
        requirements: [],
      };
    }

    const { vendor, vram } = gpu;
    const humanVram = filesize(vram);

    let description = `Found compatible hardware: ${gpu?.name}`;
    let status: SetupItemState['status'] = 'ok';

    requirements.push({
      name: 'GPU Vendor',
      expected: GPU_VENDORS.join(', '),
      actual: vendor,
      satisfied: GPU_VENDORS.includes(vendor),
    });
    requirements.push({
      name: 'GPU VRAM',
      expected: `>= ${filesize(VRAM_RECOMMENDED)}`,
      actual: humanVram,
      satisfied: vram > VRAM_RECOMMENDED,
    });

    if (!gpu.torchModes.length) {
      description =
        'GPU drivers are missing. CPU inference will be used instead.';
      status = 'error';
    } else if (this.torchMode === 'directml') {
      description = 'Suboptimal DirectML mode will be used.';
      status = 'warning';
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
    } else if (vendor !== 'NVIDIA') {
      description = `Non-NVIDIA GPUs haven't been tested, but should work correctly.`;
      status = 'warning';
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

    const pythonStorage = 5 * GB;
    total += pythonStorage;
    breakdown['Python'] = pythonStorage;

    const modelsStorage = this.models.storage;
    if (modelsStorage) {
      total += modelsStorage;
      breakdown['Model downloads'] = modelsStorage;
    }

    return { total, breakdown };
  }

  async resetBundle(resetAll = false) {
    this.status = 'required';
    await API.instance.resetBundle.mutate({ resetAll });
  }
}

export const setupStore = new SetupStore();

import { DownloadSettings } from './download.js';
import { TorchMode } from './instance.js';

export interface Requirement {
  name: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  satisfied: boolean;
}

export type SetupStatus = 'required' | 'done' | 'in_progress';

export interface SetupOS {
  version: {
    value: string;
    compatible: boolean;
  };
  platform: {
    value: string;
    compatible: boolean;
  };
  architecture: {
    value: string;
    supported: string[];
    compatible: boolean;
  };
  isGlibc?: boolean;
}

export interface SetupGPU {
  vendor: string;
  name: string;
  vram: number;
  torchModes: TorchMode[];
  potentialTorchModes: TorchMode[];
}

export interface SetupStorage {
  path: string;
  free: number;
  used: number;
  total: number;
}

export interface SetupDetails {
  os: SetupOS;
  gpus: SetupGPU[];
  storage: SetupStorage;
}

export interface SetupSettings {
  downloads: DownloadSettings[];
  torchMode: TorchMode;
  dataRoot: string;
}

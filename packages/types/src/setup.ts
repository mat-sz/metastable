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

export interface SetupGraphics {
  vendor: string;
  vram: number;
}

export interface SetupStorage {
  dataRoot: string;
  diskPath: string;
  free: number;
  total: number;
}

export interface SetupEnvironment {
  hipSdkVersion?: string;
}

export interface SetupDetails {
  os: SetupOS;
  graphics: SetupGraphics[];
  storage: SetupStorage;
  environment: SetupEnvironment;
}

export interface SetupSettings {
  downloads: DownloadSettings[];
  torchMode: TorchMode;
}

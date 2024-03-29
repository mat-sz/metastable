import { DownloadSettings } from './download.js';

export interface Requirement {
  name: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  satisfied: boolean;
}

export interface SetupStatus {
  status: 'required' | 'done' | 'in_progress';
}

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

export interface SetupPython {
  hasPip: boolean;
  version?: string;
  required: string;
  compatible: boolean;
  requirements?: Requirement[];
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
export interface SetupDetails {
  os: SetupOS;
  graphics: SetupGraphics[];
  python: SetupPython;
  storage: SetupStorage;
}

export interface SetupSettings {
  downloads: DownloadSettings[];
  pythonMode: 'static' | 'system';
  torchMode: 'nvidia' | 'amd' | 'cpu';
}

export interface SetupStatusEvent {
  event: 'setup.status';
  data: SetupStatus;
}

export type SetupEvent = SetupStatusEvent;

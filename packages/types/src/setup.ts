export interface Requirement {
  name: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  satisfied: boolean;
}

export interface SetupTask {
  progress: number;
  log: string;
  state: 'queued' | 'in_progress' | 'done' | 'error';
}

export interface SetupStatus {
  status: 'required' | 'done' | 'in_progress';
  tasks: Record<string, SetupTask>;
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
  version: string;
  required: string;
  compatible: boolean;
  requirements: Requirement[];
}

export interface SetupGraphics {
  vendor: string;
  vram?: number;
}

export interface SetupStorage {
  dataRoot: string;
  free: number;
  total: number;
}
export interface SetupDetails {
  os: SetupOS;
  graphics: SetupGraphics[];
  python?: SetupPython;
  storage: SetupStorage;
}

export interface SetupSettings {
  downloads: { name: string; type: string; url: string }[];
  pythonMode: 'static' | 'system';
}

export interface SetupStatusEvent {
  event: 'setup.status';
  data: SetupStatus;
}

export type SetupEvent = SetupStatusEvent;

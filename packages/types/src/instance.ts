import { ComfyTorchInfo } from './comfy.js';
import { Feature } from './feature.js';
import { Architecture, ModelType } from './model.js';
import { TreeGroup, TreeItem } from './tree.js';

export interface PromptStyleItem extends TreeItem {
  positive?: string;
  negative?: string;
  architecture?: Architecture | 'any';
}

export type PromptStyleSource = 'system' | 'user' | 'model';

export type PromptStyleNode = PromptStyleItem | TreeGroup;

export type PromptStyleNodeWithSource = PromptStyleNode & {
  source: PromptStyleSource;
};

export type PromptStyleItemWithSource = PromptStyleItem & {
  source: PromptStyleSource;
};

export type TorchMode = 'cuda' | 'rocm' | 'directml' | 'cpu' | 'zluda';

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  torch?: ComfyTorchInfo;
  vram: number;
  dataRoot: string;
  features: Feature[];
  defaultDirectory: string;
  authAvailable: boolean;
}

export interface UpdateInfo {
  isAutoUpdateAvailable: boolean;
  canCheckForUpdate: boolean;
  latestVersion?: string;
  isUpToDate?: boolean;
}

export type ComfyVramMode =
  | 'auto'
  | 'cpu'
  | 'novram'
  | 'lowvram'
  | 'normalvram'
  | 'highvram'
  | 'gpu-only';

export interface ExtraModelFolder {
  name: string;
  path: string;
}

export interface InstanceAccount {
  id: string;
  username: string;
  password: any;
}

export interface InstanceAuth {
  enabled: boolean;
  secret?: string;
  accounts: InstanceAccount[];
}

export interface ConfigType {
  python: {
    configured: boolean;
    mode: 'system' | 'static';
    pythonHome?: string;
    packagesDir?: string;
    bundleVersion?: string;
    features: Record<string, boolean>;
  };
  comfy?: {
    vramMode?: ComfyVramMode;
    reserveVram?: number;
    extraArgs?: string;
    env?: Record<string, string>;
    cpuVae?: boolean;
  };
  downloader: {
    apiKeys: Record<string, string>;
  };
  ui: {
    fuzzySearch: boolean;
    notifications: boolean;
    theme: 'dark' | 'light' | 'system';
    fontSize: number;
    units: {
      temperature: 'C' | 'F';
    };
  };
  generation: {
    preview: boolean;
    imageMetadata: boolean;
    memoryWarnings: boolean;
    defaultPrompt: {
      positive: string;
      negative: string;
    };
  };
  app: {
    autoUpdate: boolean;
    hideWelcome: boolean;
    hotkeys?: Record<string, string>;
  };
  styles: PromptStyleNode[];
  modelFolders: {
    [K in ModelType]?: ExtraModelFolder[];
  };
}

export interface Utilization {
  cpuUsage: number;
  ramUsed: number;
  ramTotal: number;
  hddUsed: number;
  hddTotal: number;
  cpuTemperature?: number;

  // Only available for NVIDIA.
  gpuUsage?: number;
  vramUsed?: number;
  vramTotal?: number;
  gpuTemperature?: number;
}

export interface LogItem {
  timestamp: number;
  type: string;
  text: string;
}

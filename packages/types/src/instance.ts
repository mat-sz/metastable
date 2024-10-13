import { ComfyTorchInfo } from './comfy.js';
import { Architecture } from './model.js';

export interface PromptStyle {
  id: string;
  name: string;
  positive?: string;
  negative?: string;
  architecture?: Architecture | 'any';
}

export type PromptStyleSource = 'system' | 'user' | 'model';

export type PromptStyleWithSource = PromptStyle & { source: PromptStyleSource };

export type TorchMode = 'cuda' | 'rocm' | 'directml' | 'cpu';

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  torch?: ComfyTorchInfo;
  vram: number;
  dataRoot: string;
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

export interface ConfigType {
  python: {
    configured: boolean;
    mode: 'system' | 'static';
    pythonHome?: string;
    packagesDir?: string;
    bundleVersion?: string;
  };
  comfy?: {
    vramMode?: ComfyVramMode;
    extraArgs?: string;
    env?: Record<string, string>;
  };
  civitai?: {
    apiKey?: string;
  };
  ui?: {
    fuzzySearch?: boolean;
    notifications?: boolean;
  };
  generation?: {
    preview?: boolean;
    imageMetadata?: boolean;
    memoryWarnings?: boolean;
  };
  app?: {
    autoUpdate?: boolean;
    hideWelcome?: boolean;
  };
  styles?: PromptStyle[];
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

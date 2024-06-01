import { ComfyTorchInfo } from './comfy.js';

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  torch?: ComfyTorchInfo;
  vram: number;
}

export interface UpdateInfo {
  isAutoUpdateAvailable: boolean;
  canCheckForUpdate: boolean;
  latestVersion?: string;
  isUpToDate?: boolean;
}

export interface ConfigType {
  python: {
    configured: boolean;
    mode: 'system' | 'static';
    pythonHome?: string;
    packagesDir?: string;
  };
  comfy?: {
    args?: string[];
    env?: Record<string, string>;
  };
  civitai?: {
    apiKey?: string;
  };
  ui?: {
    fuzzySearch?: boolean;
  };
  generation?: {
    preview?: boolean;
    imageMetadata?: boolean;
  };
  app?: {
    autoUpdate?: boolean;
    hideWelcome?: boolean;
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

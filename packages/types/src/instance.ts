import { Model } from './model.js';

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  models: Record<string, Model[]>;
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

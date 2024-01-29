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

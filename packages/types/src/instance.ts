import { Model } from './model.js';

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  models: Record<string, Model[]>;
}

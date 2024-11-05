import { FeatureLora } from './lora.js';
import { FeaturePulid } from './pulid.js';
import { FeatureUpscale } from './upscale.js';
import { FeatureInstance } from '../base.js';
import { FeatureControlnet } from './controlnet.js';
import { FeatureIpAdapter } from './ipadapter.js';

export function getFeatureInstances(): Record<string, FeatureInstance> {
  return {
    lora: new FeatureLora(),
    controlnet: new FeatureControlnet(),
    ipadapter: new FeatureIpAdapter(),
    upscale: new FeatureUpscale(),
    pulid: new FeaturePulid(),
  };
}

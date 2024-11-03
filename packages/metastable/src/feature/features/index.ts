import { FeatureLora } from './lora.js';
import { FeaturePulid } from './pulid.js';
import { FeatureUpscale } from './upscale.js';
import { Metastable } from '../../index.js';
import { FeatureInstance } from '../base.js';
import { FeatureControlnet } from './controlnet.js';
import { FeatureIpAdapter } from './ipadapter.js';

export function getFeatureInstances(
  metastable: Metastable,
): Record<string, FeatureInstance> {
  return {
    lora: new FeatureLora(metastable),
    controlnet: new FeatureControlnet(metastable),
    ipadapter: new FeatureIpAdapter(metastable),
    upscale: new FeatureUpscale(metastable),
    pulid: new FeaturePulid(metastable),
  };
}

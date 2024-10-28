import { FeatureLora } from './lora.js';
import { FeaturePulid } from './pulid.js';
import { FeatureUpscale } from './upscale.js';
import { Metastable } from '../../index.js';
import { FeatureInstance } from '../base.js';

export function getFeatureInstances(
  metastable: Metastable,
): Record<string, FeatureInstance> {
  return {
    lora: new FeatureLora(metastable),
    upscale: new FeatureUpscale(metastable),
    pulid: new FeaturePulid(metastable),
  };
}

import { FeatureLora } from './lora.js';
import { FeaturePulid } from './pulid.js';
import { FeatureUpscale } from './upscale.js';
import { FeatureInstance } from '../base.js';
import { FeatureControlnet } from './controlnet.js';
import { FeatureGGUF } from './gguf.js';
import { FeatureIpAdapter } from './ipadapter.js';
import { FeatureSegment } from './segment.js';
import { FeatureTaesd } from './taesd.js';

export function getFeatureInstances(): Record<string, FeatureInstance> {
  return {
    lora: new FeatureLora(),
    controlnet: new FeatureControlnet(),
    ipadapter: new FeatureIpAdapter(),
    upscale: new FeatureUpscale(),
    pulid: new FeaturePulid(),
    taesd: new FeatureTaesd(),
    segment: new FeatureSegment(),
    gguf: new FeatureGGUF(),
  };
}

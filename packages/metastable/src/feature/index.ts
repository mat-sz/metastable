import { Feature } from '@metastable/types';

import { Metastable } from '../index.js';
import { FeatureInstance } from './base.js';
import { FeaturePulid } from './features/pulid.js';
import { FeatureUpscale } from './features/upscale.js';
import { FeatureInstallTask } from './installTask.js';

export class FeatureManager {
  features: Record<string, FeatureInstance> = {
    upscale: new FeatureUpscale(this.metastable),
    pulid: new FeaturePulid(this.metastable),
  };

  constructor(private metastable: Metastable) {}

  get availableFeatures() {
    return Object.values(this.features);
  }

  async all(): Promise<Feature[]> {
    return await Promise.all(
      this.availableFeatures.map(feature => feature.info()),
    );
  }

  install(featureId: string) {
    const feature = this.availableFeatures.find(
      feature => feature.id === featureId,
    );
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    const task = new FeatureInstallTask(feature);
    this.metastable.tasks.queues.settings.add(task);
  }
}

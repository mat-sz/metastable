import { Feature } from '@metastable/types';

import { Metastable } from '../index.js';
import { FeatureInstance } from './base.js';
import { FeaturePulid } from './features/pulid.js';
import { FeatureInstallTask } from './installTask.js';

export class FeatureManager {
  availableFeatures: FeatureInstance[] = [];

  constructor(private metastable: Metastable) {
    this.availableFeatures.push(new FeaturePulid(this.metastable));
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

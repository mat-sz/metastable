import { Feature } from '@metastable/types';

import { Metastable } from '#metastable';
import { getFeatureInstances } from './features/index.js';
import { FeatureInstallTask } from './installTask.js';

export class FeatureManager {
  features = getFeatureInstances();

  constructor() {}

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
    Metastable.instance.tasks.queues.settings.add(task);
  }
}

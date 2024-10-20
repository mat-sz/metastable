import { ExtraFeature } from '@metastable/types';

import { Metastable } from '../index.js';
import { EXTRA_FEATURES, ExtraFeatureWithoutState } from './consts.js';
import { ExtraInstallTask } from './installTask.js';

export class ExtraFeatureManager {
  constructor(private metastable: Metastable) {}

  async all(): Promise<ExtraFeature[]> {
    return await Promise.all(
      EXTRA_FEATURES.map(async feature => {
        const installed = await this.isFeatureInstalled(feature);

        return {
          ...feature,
          installed: installed,
          enabled: installed,
        };
      }),
    );
  }

  private async isFeatureInstalled(feature: ExtraFeatureWithoutState) {
    let hasPackages = true;
    if (feature.pythonPackages) {
      const python = this.metastable.python;
      if (!python) {
        return false;
      }

      const packages = await python.packages(
        feature.pythonPackages.map(item => item.name),
      );
      if (Object.values(packages).includes(null)) {
        hasPackages = false;
      }
    }

    return hasPackages;
  }

  async isEnabled(featureId: string) {
    const feature = EXTRA_FEATURES.find(feature => feature.id === featureId);
    if (!feature) {
      return false;
    }

    return await this.isFeatureInstalled(feature);
  }

  install(featureId: string) {
    const task = new ExtraInstallTask(
      'extra.install',
      featureId,
      this.metastable,
    );
    this.metastable.tasks.queues.settings.add(task);
  }
}

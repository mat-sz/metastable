import { Metastable } from '../index.js';
import { EXTRA_FEATURES, ExtraFeature } from './consts.js';

export interface ExtraFeatureItem extends ExtraFeature {
  installed: boolean;
  enabled: boolean;
}

export class ExtraFeatureManager {
  constructor(private metastable: Metastable) {}

  async all(): Promise<ExtraFeatureItem[]> {
    const python = this.metastable.python;
    if (!python) {
      return EXTRA_FEATURES.map(feature => ({
        ...feature,
        installed: false,
        enabled: false,
      }));
    }

    return await Promise.all(
      EXTRA_FEATURES.map(async feature => {
        let hasPackages = true;
        if (feature.pythonPackages) {
          const packages = await python.packages(
            feature.pythonPackages.map(item => item.name),
          );
          if (Object.values(packages).includes(null)) {
            hasPackages = false;
          }
        }

        return {
          ...feature,
          installed: hasPackages,
          enabled: hasPackages,
        };
      }),
    );
  }
}

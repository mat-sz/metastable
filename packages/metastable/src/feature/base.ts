import { Feature, FeatureProjectFields } from '@metastable/types';

import { Metastable } from '../index.js';

export interface FeatureInstance {
  readonly id: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly projectFields: FeatureProjectFields;

  install(onLog?: (data: string) => void): Promise<void>;
  isInstalled(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  info(): Promise<Feature>;
}

export class FeatureBase implements FeatureInstance {
  readonly id: string = '';
  readonly name: string = '';
  readonly description: string | undefined;
  readonly projectFields: FeatureProjectFields;

  constructor(protected metastable: Metastable) {}

  async install() {}

  async isInstalled() {
    return true;
  }

  async isEnabled() {
    return await this.isInstalled();
  }

  async info(): Promise<Feature> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      projectFields: this.projectFields,
      enabled: await this.isEnabled(),
      installed: await this.isInstalled(),
    };
  }
}

export class FeaturePython extends FeatureBase {
  readonly pythonPackages: { name: string; extra?: string }[] = [];
  readonly pythonNamespaceGroup: string | undefined;

  async isInstalled() {
    if (!(await super.isInstalled())) {
      return false;
    }

    let hasPackages = true;
    if (this.pythonPackages.length) {
      const python = this.metastable.python;
      if (!python) {
        return false;
      }

      const packages = await python.packages(
        this.pythonPackages.map(item => item.name),
      );
      if (Object.values(packages).includes(null)) {
        hasPackages = false;
      }
    }

    return hasPackages;
  }

  async install(onLog?: (data: string) => void) {
    if (this.pythonPackages.length) {
      const python = this.metastable.python;
      if (!python) {
        throw new Error(`Metastable is not fully configured.`);
      }

      await python.pipInstall(
        this.pythonPackages.map(item => `${item.name}${item.extra || ''}`),
        onLog,
      );
    }

    await this.metastable.restartComfy();
  }
}

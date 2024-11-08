import { Feature, FeatureProjectFields } from '@metastable/types';

import { Metastable } from '#metastable';
import { PromptTask } from '../comfy/tasks/prompt.js';

export interface FeatureInstance {
  readonly id: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly projectFields: FeatureProjectFields;

  install(onLog?: (data: string) => void): Promise<void>;
  isInstalled(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  info(): Promise<Feature>;
  onPromptInit?(task: PromptTask): Promise<void>;
  onPromptPreviewInit?(task: PromptTask): Promise<void>;
  onBeforeConditioning?(task: PromptTask): Promise<void>;
  onAfterConditioning?(task: PromptTask): Promise<void>;
  onAfterSample?(task: PromptTask): Promise<void>;
}

export class FeatureBase implements FeatureInstance {
  readonly id: string = '';
  readonly name: string = '';
  readonly description: string | undefined;
  readonly projectFields: FeatureProjectFields;

  async install() {}

  async isInstalled() {
    return true;
  }

  async isEnabled() {
    const { features } = await Metastable.instance.config.get('python');
    const enabled = features?.[this.id] ?? true;
    return enabled && (await this.isInstalled());
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
  readonly pythonNamespaceGroup: string | undefined = undefined;

  async isInstalled() {
    if (!(await super.isInstalled())) {
      return false;
    }

    if (this.pythonPackages.length) {
      const python = Metastable.instance.python;
      if (!python) {
        return false;
      }

      if (this.pythonPackages.some(item => !python.packages[item.name])) {
        return false;
      }
    }

    return true;
  }

  async install(onLog?: (data: string) => void) {
    if (this.pythonPackages.length) {
      const python = Metastable.instance.python;
      if (!python) {
        throw new Error(`Metastable is not fully configured.`);
      }

      await python.pipInstall(
        this.pythonPackages.map(item => `${item.name}${item.extra || ''}`),
        onLog,
      );
    }

    await Metastable.instance.restartComfy();
  }
}

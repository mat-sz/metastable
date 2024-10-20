import { TaskState } from '@metastable/types';

import { Metastable } from '../index.js';
import { EXTRA_FEATURES } from './consts.js';
import { BaseTask } from '../tasks/task.js';

export class ExtraInstallTask extends BaseTask {
  constructor(
    type: string,
    public featureId: string,
    private metastable: Metastable,
  ) {
    super(type, { featureId });
    this.created();
  }

  async execute() {
    const feature = EXTRA_FEATURES.find(
      feature => feature.id === this.featureId,
    );
    if (!feature) {
      throw new Error(`Extra feature ${this.featureId} not found.`);
    }

    if (feature.pythonPackages) {
      const python = this.metastable.python;
      if (!python) {
        throw new Error(`Metastable is not fully configured.`);
      }

      await python.pipInstall(
        feature.pythonPackages.map(item => `${item.name}${item.extra || ''}`),
        data => this.appendLog(data),
      );
    }

    await this.metastable.restartComfy();
    return TaskState.SUCCESS;
  }
}

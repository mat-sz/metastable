import { TaskState } from '@metastable/types';

import { Metastable } from '#metastable';
import { FeatureInstance } from './base.js';
import { BaseTask } from '../tasks/task.js';

export class FeatureInstallTask extends BaseTask {
  constructor(private feature: FeatureInstance) {
    super('feature.install', { featureId: feature.id });
    this.created();
  }

  async execute() {
    await this.feature.install(data => this.appendLog(data));
    Metastable.instance.infoUpdated();
    return TaskState.SUCCESS;
  }
}

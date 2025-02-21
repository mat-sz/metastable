import {
  ModelType,
  ProjectTaskData,
  ProjectTrainingSettings,
  Task,
} from '@metastable/types';
import { Project as APIProject } from '@metastable/types';
import { action, computed, makeObservable, observable } from 'mobx';

import { API } from '$api';
import { modelStore } from '$stores/ModelStore';
import { BaseProject } from './base';

interface ProjectTrainingUI {
  collapsed?: Record<string, boolean>;
}

export function defaultSettings(): ProjectTrainingSettings {
  const checkpoint = modelStore.defaultModel(ModelType.CHECKPOINT);

  return {
    version: 1,
    models: {
      mode: 'simple',
      checkpoint: checkpoint?.mrn,
    },
    input: {
      activationTags: [],
      bucketing: true,
      repeats: 1,
      resolution: { width: 1024, height: 1024 },
      shuffleTags: false,
    },
    output: {
      type: 'lora',
    },
    network: {
      dimensions: 1,
      alpha: 1,
    },
    learningRates: {
      network: 1,
      unet: 1,
      textEncoder: 1,
    },
    learningRateScheduler: {
      name: 'cosine',
      number: 1,
      warmupRatio: 1,
      minSnrGamma: true,
    },
    optimizer: {
      name: 'prodigy',
      arguments: [],
    },
    limits: {
      trainingEpochs: 1,
      saveEveryXEpochs: 1,
      keepOnlyXEpochs: 1,
      batchSize: 1,
    },
  };
}

export class TrainingProject extends BaseProject<
  ProjectTrainingSettings,
  ProjectTrainingUI
> {
  currentTask: Task<ProjectTaskData> | undefined = undefined;

  constructor(data: APIProject) {
    data.settings ??= defaultSettings();
    super(data);

    this.mode = 'main';
    makeObservable(this, {
      currentTask: observable,
      selectTask: action,
      viewTask: computed,
    });
  }

  selectTask(task?: Task<ProjectTaskData>) {
    this.mode = 'images';
    this.currentTask = task;
    this.currentOutput = undefined;
  }

  get viewTask() {
    return (
      this.currentTask || (!this.currentOutput ? this.tasks[0] : undefined)
    );
  }

  async request() {
    this.save();

    await API.project.train.mutate({
      projectId: this.id,
      settings: this.settings,
    });
  }
}

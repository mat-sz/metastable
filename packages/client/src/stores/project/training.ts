import {
  Project as APIProject,
  ModelType,
  ProjectTaggingSettings,
  ProjectTrainingSettings,
} from '@metastable/types';
import { action, makeObservable, toJS } from 'mobx';

import { API } from '$api';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

export function defaultSettings(): ProjectTrainingSettings {
  return {
    mode: 'lora',
    base: {
      name: mainStore.defaultModelName(ModelType.CHECKPOINT),
      sdxl: false,
    },
    resolution: { width: 512, height: 512 },
    network: {
      alpha: 8,
      dimensions: 16,
    },
    learningRates: {
      network: 0.0003,
      unet: 5e-4,
      textEncoder: 1e-4,
    },
    learningRateScheduler: {
      name: 'cosine_with_restarts',
      number: 3,
      warmupRatio: 0.05,
      minSnrGamma: true,
    },
    dataset: {
      bucketing: true,
      activationTags: [],
      shuffleTags: true,
      repeats: 10,
    },
    optimizer: {
      name: 'Adafactor',
      arguments: [],
    },
    limits: {
      trainingEpochs: 10,
      saveEveryXEpochs: 1,
      keepOnlyXEpochs: 1,
      batchSize: 2,
    },
  };
}

export class TrainingProject extends BaseProject<ProjectTrainingSettings> {
  constructor(
    data: Omit<APIProject, 'settings'>,
    settings: ProjectTrainingSettings = defaultSettings(),
  ) {
    super(data, settings);
    makeObservable(this, {
      request: action,
      setSettings: action,
    });
  }

  setSettings(settings: ProjectTrainingSettings) {
    this.settings = settings;
  }

  async cancel() {
    await API.project.training.stop.mutate({ projectId: this.id });
  }

  async tag(settings: ProjectTaggingSettings) {
    await API.project.tagger.start.mutate({ projectId: this.id, settings });
  }

  async request() {
    const settings = toJS(this.settings);
    this.save();
    mainStore.trainingQueue.push({ id: this.id });
    await API.project.training.start.mutate({ projectId: this.id, settings });
  }
}

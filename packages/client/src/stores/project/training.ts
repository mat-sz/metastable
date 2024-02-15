import { action, makeObservable, observable, runInAction, toJS } from 'mobx';
import {
  Project as APIProject,
  ProjectTrainingSettings,
  ModelType,
} from '@metastable/types';

import { API } from '@api';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

export function defaultSettings(): ProjectTrainingSettings {
  return {
    mode: 'lora',
    bucketing: false,
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
      activationTags: [],
      shuffleTags: true,
      repeats: 10,
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
  uploadQueue: File[] = [];

  constructor(
    data: APIProject,
    settings: ProjectTrainingSettings = defaultSettings(),
  ) {
    super(data, settings);
    makeObservable(this, {
      uploadQueue: observable,
      request: action,
      onPromptDone: action,
      setSettings: action,
    });
  }

  async addInput(file: File) {
    this.uploadQueue.push(file);
    if (this.uploadQueue.length === 1) {
      this.handleUploadQueue();
    }
  }

  private async handleUploadQueue() {
    const file = this.uploadQueue.pop();
    if (file) {
      try {
        const names = await API.projects.upload(this.id, file);
        if (names) {
          runInAction(() => {
            this.allInputs.push(...names);
          });
        }
      } catch {}
      this.handleUploadQueue();
    }
  }

  setSettings(settings: ProjectTrainingSettings) {
    this.settings = settings;
  }

  async cancel() {
    await API.projects.stopTraining(this.id);
  }

  async request() {
    const settings = toJS(this.settings);
    this.save();
    mainStore.trainingQueue.push({ id: this.id });
    await API.projects.train(this.id, settings);
  }
}

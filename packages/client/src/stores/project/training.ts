import { action, makeObservable, observable, runInAction, toJS } from 'mobx';
import {
  Project as APIProject,
  ProjectTrainingSettings,
  ModelType,
} from '@metastable/types';
import { Base64 } from 'js-base64';

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
        const result = await API.project.input.save.mutate({
          projectId: this.id,
          data: Base64.fromUint8Array(new Uint8Array(await file.arrayBuffer())),
          name: file.name,
        });
        if (result?.name) {
          runInAction(() => {
            this.allInputs.push(result.name);
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
    await API.project.training.stop.mutate({ projectId: this.id });
  }

  async request() {
    const settings = toJS(this.settings);
    this.save();
    mainStore.trainingQueue.push({ id: this.id });
    await API.project.training.start.mutate({ projectId: this.id, settings });
  }
}

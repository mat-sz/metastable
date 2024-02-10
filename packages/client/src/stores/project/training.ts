import { action, makeObservable, observable, runInAction } from 'mobx';
import { ProjectSettings, Project as APIProject } from '@metastable/types';

import { API } from '@api';
import { BaseProject } from './base';

interface TrainingProjectSettings {}

export class TrainingProject extends BaseProject<TrainingProjectSettings> {
  uploadQueue: File[] = [];

  constructor(data: APIProject, settings: TrainingProjectSettings = {}) {
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

  setSettings(settings: ProjectSettings) {
    this.settings = settings;
  }

  async request() {}
}

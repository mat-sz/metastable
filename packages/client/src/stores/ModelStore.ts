import { Model, ModelType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';

class ModelStore {
  models: Record<string, Model[]> = {};

  constructor() {
    makeAutoObservable(this);

    API.model.onChange.subscribe(undefined, {
      onData: () => {
        this.refresh();
      },
    });

    this.init();
  }

  async init() {
    await this.refresh();
  }

  async refresh() {
    const data = await API.model.all.query();
    runInAction(() => {
      this.models = data;
    });
  }

  get types(): ModelType[] {
    return Object.entries(this.models)
      .filter(entry => entry[1].length > 0)
      .map(entry => entry[0]) as ModelType[];
  }

  has(type: ModelType, name: string) {
    return !!this.find(type, name);
  }

  find(type: ModelType, name: string) {
    return this.models[type]?.find(({ file }) => file.name === name);
  }

  type(type: ModelType) {
    return this.models[type] || [];
  }

  defaultModel(type: ModelType) {
    return this.models[type]?.[0];
  }
}

export const modelStore = new ModelStore();

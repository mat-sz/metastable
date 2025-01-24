import { ConfigType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';

export class ConfigStore {
  data?: ConfigType = undefined;

  constructor() {
    makeAutoObservable(this);
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(() => this.save(), 1000) as any;
  }

  async refresh() {
    const data = await API.instance.config.get.query();
    runInAction(() => {
      this.data = data;
    });
  }

  async save() {
    const data = await API.instance.config.set.mutate(this.data);
    runInAction(() => {
      this.data = data;
    });
  }

  set(data: ConfigType) {
    this.data = data;
    this.triggerAutosave();
  }
}

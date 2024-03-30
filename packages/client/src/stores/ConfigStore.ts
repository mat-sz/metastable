import { ConfigType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';

export class ConfigStore {
  data?: ConfigType = undefined;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    this.refresh();
  }

  async refresh() {
    const data = await API.instance.config.get.query();
    runInAction(() => {
      this.data = data;
    });
  }

  async store(data: ConfigType) {
    const newData = await API.instance.config.set.mutate(data);
    runInAction(() => {
      this.data = newData;
    });
  }
}

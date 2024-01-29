import { makeAutoObservable, runInAction } from 'mobx';
import { ConfigType } from '@metastable/types';

import { API } from '../api';

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
    const data = await API.config.all();
    runInAction(() => {
      this.data = data;
    });
  }

  async store(data: ConfigType) {
    const newData = await API.config.store(data);
    runInAction(() => {
      this.data = newData;
    });
  }
}

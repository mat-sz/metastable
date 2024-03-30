import { Project as APIProject, ImageFile } from '@metastable/types';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';

import { API } from '$api';

export class BaseProject<T = any> {
  currentOutputs: ImageFile[] = [];
  mode: string = 'images';
  id;
  name;
  type;

  constructor(
    data: APIProject,
    public settings: T,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.currentOutputs = data.lastOutput ? [data.lastOutput] : [];

    makeObservable(this, {
      currentOutputs: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      settings: observable,
      rename: action,
      save: action,
      triggerAutosave: action,
      queueCount: computed,
      progressValue: computed,
      progressMax: computed,
      progressMarquee: computed,
    });
  }

  get queueCount() {
    return 0;
  }

  get progressValue() {
    return 0;
  }

  get progressMax() {
    return 0;
  }

  get progressMarquee() {
    return false;
  }

  async rename(name: string) {
    const json = await API.project.update.mutate({ projectId: this.id, name });
    if (json) {
      runInAction(() => {
        this.id = json.id;
        this.name = json.name;
      });
    }
  }

  async save() {
    const settings = toJS(this.settings);

    await API.project.update.mutate({
      projectId: this.id,
      settings,
    });
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(() => this.save(), 5000) as any;
  }

  onPromptDone(outputs: ImageFile[]) {
    this.currentOutputs = outputs;
  }
}

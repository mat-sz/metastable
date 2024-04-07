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
import { mainStore } from '$stores/MainStore';
export class BaseProject<T = any> {
  currentOutputs: ImageFile[] = [];
  mode: string = 'images';
  id;
  name;
  type;
  temporary;

  constructor(
    data: Omit<APIProject, 'settings'>,
    public settings: T,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.currentOutputs = data.lastOutput ? [data.lastOutput] : [];
    this.temporary = data.temporary ?? false;

    makeObservable(this, {
      currentOutputs: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      temporary: observable,
      settings: observable,
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

  async save(name?: string) {
    const id = this.id;
    const settings = toJS(this.settings);

    const json = await API.project.update.mutate({
      projectId: id,
      settings,
      name,
      temporary: this.temporary && !name,
    });

    if (json) {
      runInAction(() => {
        this.id = json.id;
        this.name = json.name;
        if (mainStore.projects.currentId === id && id !== json.id) {
          mainStore.projects.select(json.id);
        }

        if (!json.temporary) {
          mainStore.projects.pushRecent(json.id);
        }
      });
    }
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

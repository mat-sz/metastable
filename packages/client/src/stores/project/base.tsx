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
import { TemporaryProject } from '$modals/temporaryProject';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';

export class BaseProject<T = any> {
  currentOutput: string | undefined = undefined;
  mode: string = 'images';
  id;
  name;
  type;
  temporary;
  outputs: ImageFile[] = [];

  constructor(
    data: Omit<APIProject, 'settings'>,
    public settings: T,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.currentOutput = data.lastOutput?.image.url;
    this.temporary = data.temporary ?? false;

    makeObservable(this, {
      currentOutput: observable,
      outputs: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      temporary: observable,
      settings: observable,
      save: action,
      triggerAutosave: action,
      onPromptDone: action,
      queueCount: computed,
      progressValue: computed,
      progressMax: computed,
      progressMarquee: computed,
    });
    this.refresh();
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

  async refresh() {
    try {
      const outputs = await API.project.output.all.query({
        projectId: this.id,
      });
      if (outputs) {
        runInAction(() => {
          this.outputs = outputs;
        });
      }
    } catch {
      //
    }
  }

  async delete() {
    mainStore.projects.close(this.id);
    await API.project.delete.mutate({ projectId: this.id });
  }

  async close(force = false) {
    if (!force && this.temporary) {
      modalStore.show(<TemporaryProject project={this} />);
      return;
    }

    mainStore.projects.close(this.id);
  }

  async save(name?: string, temporary?: boolean) {
    const id = this.id;
    const settings = toJS(this.settings);

    const json = await API.project.update.mutate({
      projectId: id,
      settings,
      name,
      temporary: temporary ?? (this.temporary && !name),
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

        mainStore.projects.refresh();
      });
    }
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(() => this.save(), 5000) as any;
  }

  onPromptDone(outputs: ImageFile[]) {
    this.currentOutput = outputs[0]?.image.url;
    this.outputs.push(...outputs);
  }
}

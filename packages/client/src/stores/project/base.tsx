import { Project as APIProject, ImageFile, TaskState } from '@metastable/types';
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
      tasks: computed,
      firstTask: computed,
      queueCount: computed,
      progressValue: computed,
      progressMax: computed,
      progressMarquee: computed,
    });
    this.refresh();
  }

  get tasks() {
    return mainStore.tasks.queues.project?.filter(
      task => task.data?.projectId === this.id,
    );
  }

  get firstTask() {
    return this.tasks.find(
      item =>
        item.state === TaskState.RUNNING || item.state === TaskState.PREPARING,
    );
  }

  get queueCount() {
    return this.tasks.length;
  }

  get progressValue(): number | undefined {
    return this.firstTask?.progress;
  }

  get progressMax(): number | undefined {
    return this.firstTask ? 1 : undefined;
  }

  get progressMarquee() {
    return !!this.firstTask && !this.firstTask.progress;
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
}

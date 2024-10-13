import {
  Project as APIProject,
  ProjectFileType,
  ProjectImageFile,
  TaskState,
} from '@metastable/types';
import {
  action,
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';

import { API } from '$api';
import { ProjectDraft } from '$modals/projectDraft';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { UploadQueueStore } from './UploadQueueStore';

export class BaseProject<TSettings = any, TUI = any> {
  currentOutput: ProjectImageFile | undefined = undefined;
  mode: string = 'images';
  id;
  name;
  type;
  draft;
  files: Record<ProjectFileType, ProjectImageFile[]>;
  settings: TSettings;
  ui: TUI;
  filesSubscription;
  uploadQueue: Record<ProjectFileType, UploadQueueStore>;

  constructor(data: APIProject) {
    this.settings = data.settings;
    this.ui = data.ui ?? {};
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.currentOutput = data.lastOutput;
    this.draft = data.draft ?? false;

    const files = {} as any;
    const uploadQueue = {} as any;
    for (const key of Object.values(ProjectFileType)) {
      files[key] = [];
      uploadQueue[key] = new UploadQueueStore(key, this.id);
    }
    this.files = files;
    this.uploadQueue = uploadQueue;

    makeObservable(this, {
      currentOutput: observable,
      files: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      draft: observable,
      settings: observable,
      ui: observable,
      save: action,
      tasks: computed,
      firstTask: computed,
      queueCount: computed,
      progressValue: computed,
      progressMax: computed,
      progressMarquee: computed,
    });
    this.refresh();

    autorun(() => {
      if (toJS(this.ui)) {
        this.triggerAutosaveUI();
      }
    });

    autorun(() => {
      if (toJS(this.settings)) {
        this.triggerAutosave();
      }
    });

    this.filesSubscription = API.project.file.onChange.subscribe(
      { projectId: this.id },
      {
        onData: type => {
          this.refreshFiles(type);
        },
      },
    );
  }

  get tasks() {
    return [
      ...(mainStore.tasks.queues.project?.filter(
        task => task.data?.projectId === this.id,
      ) || []),
    ].reverse();
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

  async refreshFiles(type: ProjectFileType) {
    try {
      const files = await API.project.file.all.query({
        type: type,
        projectId: this.id,
      });
      if (files) {
        runInAction(() => {
          this.files[type] = files;
        });
      }
    } catch {
      //
    }
  }

  async refresh() {
    await Promise.all(
      Object.values(ProjectFileType).map(type => this.refreshFiles(type)),
    );
  }

  async cleanup() {
    clearTimeout(this._autosaveTimeout);
    clearTimeout(this._autosaveUITimeout);
    this.filesSubscription.unsubscribe();
  }

  async delete() {
    this.cleanup();
    mainStore.projects.close(this.id);
    mainStore.projects.removeRecent(this.id);
    await API.project.delete.mutate({ projectId: this.id });
    mainStore.projects.refresh();
  }

  async close(force = false) {
    if (!force && this.draft) {
      modalStore.show(<ProjectDraft project={this} />);
      return;
    }

    this.cleanup();
    mainStore.projects.close(this.id);
  }

  async duplicate(name?: string) {
    await mainStore.projects.create(
      name ?? this.name,
      this.type,
      this.draft,
      this.settings,
    );
  }

  async saveUI() {
    await API.project.update.mutate({
      projectId: this.id,
      ui: this.ui,
    });
  }

  async save(name?: string, draft?: boolean, auto = false) {
    const id = this.id;

    const json = await API.project.update.mutate({
      projectId: id,
      settings: this.settings,
      name,
      draft: draft ?? (this.draft && !name),
    });

    if (json) {
      runInAction(() => {
        this.id = json.id;
        this.name = json.name;
        if (mainStore.projects.currentId === id && id !== json.id) {
          mainStore.projects.select(json.id);
        }

        if (!json.draft && !auto) {
          mainStore.projects.removeRecent(id);
          mainStore.projects.pushRecent(json.id);
        }

        mainStore.projects.refresh();
      });
    }
  }

  async deleteFile(type: ProjectFileType, name: string) {
    this.files[type] = this.files[type].filter(file => file.name !== name);

    if (type === ProjectFileType.OUTPUT && this.currentOutput?.name === name) {
      this.currentOutput = this.files.output[this.files.output.length - 1];
    }

    await API.project.file.delete.mutate({
      type,
      name,
      projectId: this.id,
    });
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(
      () => this.save(undefined, undefined, true),
      5000,
    ) as any;
  }

  private _autosaveUITimeout: number | undefined = undefined;
  triggerAutosaveUI() {
    clearTimeout(this._autosaveUITimeout);
    this._autosaveUITimeout = setTimeout(() => this.saveUI(), 1000) as any;
  }
}

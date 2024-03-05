import { makeAutoObservable, runInAction } from 'mobx';
import { Project as APIProject } from '@metastable/types';

import { API } from '$api';
import { arrayMove } from '$utils/array';
import { tryParse } from '$utils/json';
import { createProject } from './project';
import { BaseProject } from './project/base';
import { defaultSettings } from './project/simple';

const LS_RECENT = 'metastable_recent_projects';
const MAX_RECENT_ITEMS = 6;
export class ProjectStore {
  projects: BaseProject[] = [];
  currentId: APIProject['id'] | undefined = undefined;
  recent: APIProject[] = [];
  all: APIProject[] = [];

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  get current() {
    return this.projects.find(project => project.id === this.currentId);
  }

  async init() {
    this.refresh();
  }

  async refresh() {
    const json = await API.project.all.query();
    if (!json) {
      return;
    }

    runInAction(() => {
      this.all = json as any;

      const recentArray = tryParse(localStorage.getItem(LS_RECENT)) || [];
      const recent: APIProject[] = Array.isArray(recentArray)
        ? (recentArray
            .slice(0, MAX_RECENT_ITEMS)
            .map(id => json.find(project => project.id === id))
            .filter(item => !!item) as APIProject[])
        : [];
      this.recent =
        recent.length > 0 ? recent : (json.slice(0, MAX_RECENT_ITEMS) as any);
    });
  }

  private pushRecent(id: string) {
    const recentArray: string[] =
      tryParse(localStorage.getItem(LS_RECENT)) || [];
    const recent = Array.isArray(recentArray)
      ? recentArray.filter(itemId => itemId !== id)
      : [];
    recent.unshift(id);
    localStorage.setItem(
      LS_RECENT,
      JSON.stringify(recent.slice(0, MAX_RECENT_ITEMS)),
    );
  }

  async create(name: string, type = 'simple') {
    if (!name.trim()) {
      return;
    }

    const settings = defaultSettings();
    const project = {
      name,
      type,
      settings,
    };

    const json = await API.project.create.mutate(project);

    runInAction(() => {
      this.projects.push(createProject(json as any, settings));
      this.select(json.id);
    });

    this.pushRecent(json.id);
    this.refresh();
  }

  async open(id: APIProject['id']) {
    const json = await API.project.get.query({ projectId: id });
    if (!json) {
      return;
    }

    const settings = json.settings ?? defaultSettings();

    const project = createProject(json as any, settings);
    runInAction(() => {
      this.projects = [
        ...this.projects.filter(project => project.id !== id),
        project,
      ];
      this.select(json.id);
    });

    this.pushRecent(json.id);
    this.refresh();
  }

  select(id?: APIProject['id']) {
    this.currentId = id;
  }

  move(fromId: APIProject['id'], toId?: APIProject['id']) {
    const from = this.projects.findIndex(p => p.id === fromId);
    const to = toId ? this.projects.findIndex(p => p.id === toId) : undefined;
    if (from !== -1 && to !== -1) {
      this.projects = arrayMove(this.projects, from, to);
    }
  }

  close(id: APIProject['id']) {
    this.projects = this.projects.filter(project => project.id !== id);

    if (id === this.currentId) {
      this.currentId = this.projects[0]?.id;
    }
  }
}

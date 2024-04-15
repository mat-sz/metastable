import { Project as APIProject } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';
import { arrayMove } from '$utils/array';
import { tryParse } from '$utils/json';
import { mainStore } from './MainStore';
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
  loading = false;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  get temporary() {
    return this.projects.filter(project => project.temporary);
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

  pushRecent(id: string) {
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

  async create(name: string = 'Untitled', type = 'simple', temporary = false) {
    if (this.loading) {
      return;
    }

    if (!name.trim()) {
      return;
    }

    this.loading = true;
    const settings = defaultSettings();
    const project = {
      name,
      type,
      settings,
      temporary,
    };

    try {
      const json = await API.project.create.mutate(project);

      runInAction(() => {
        this.projects.push(createProject(json, settings));
        this.select(json.id);
      });

      if (!temporary) {
        this.pushRecent(json.id);
      }
      this.refresh();
    } finally {
      this.loading = false;
    }
  }

  async open(id: APIProject['id']) {
    if (this.loading) {
      return;
    }

    this.loading = true;

    try {
      const json = await API.project.get.query({ projectId: id });
      if (!json) {
        return;
      }

      const settings = json.settings ?? defaultSettings();
      if (settings.version !== 1) {
        return;
      }

      const project = createProject(json, settings);
      runInAction(() => {
        this.projects = [
          ...this.projects.filter(project => project.id !== id),
          project,
        ];
        this.select(json.id);
      });

      if (!json.temporary) {
        this.pushRecent(json.id);
      }
      this.refresh();
    } finally {
      this.loading = false;
    }
  }

  select(id?: APIProject['id']) {
    this.currentId = id;
    mainStore.view = id ? 'project' : 'home';
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
      const selectId = this.projects[0]?.id;
      if (mainStore.view === 'project') {
        this.select(selectId);
      } else {
        this.currentId = selectId;
      }
    }
  }
}

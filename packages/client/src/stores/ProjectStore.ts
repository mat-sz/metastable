import { makeAutoObservable, runInAction } from 'mobx';
import { Project as APIProject } from '@metastable/types';

import { Project } from './project';
import { arrayMove, defaultProjectSettings } from '../helpers';
import { API } from '../api';

export class ProjectStore {
  projects: Project[] = [];
  currentId: APIProject['id'] | undefined = undefined;
  recent: APIProject[] = [];

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
    const json = await API.projects.all();
    runInAction(() => {
      this.recent = json;
    });
  }

  async create(name: string) {
    if (!name.trim()) {
      return;
    }

    const settings = defaultProjectSettings();
    const project = {
      name,
      settings: JSON.stringify(settings),
    };

    const json = await API.projects.create(project);

    runInAction(() => {
      this.projects.push(new Project(json, settings));
      this.select(json.id);
    });

    this.refresh();
  }

  async open(id: APIProject['id']) {
    const json = await API.projects.get(id);
    const settings = json.settings
      ? JSON.parse(json.settings)
      : defaultProjectSettings();
    if (!settings.models.loras) {
      settings.models.loras = [];
    }
    if (!settings.models.controlnets) {
      settings.models.controlnets = [];
    }

    const project = new Project(json, settings);
    runInAction(() => {
      this.projects = [
        ...this.projects.filter(project => project.id !== id),
        project,
      ];
      this.select(json.id);
    });

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

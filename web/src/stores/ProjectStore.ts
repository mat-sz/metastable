import { makeAutoObservable, runInAction } from 'mobx';

import { APIProject } from '../types/project';
import { Project } from './project';
import { arrayMove, defaultProjectSettings } from '../helpers';
import { httpGet, httpPost } from '../http';

export class ProjectStore {
  projects: Project[] = [];
  currentId: number | undefined = undefined;
  recent: APIProject[] = [];

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  get current() {
    return this.projects.find(project => project.id === this.currentId);
  }

  async init() {
    const json = await httpGet('/projects');
    runInAction(() => {
      this.recent = json;
    });
  }

  async create(name: string) {
    const settings = defaultProjectSettings();
    const project = {
      name,
      settings: JSON.stringify(settings),
    };

    const json = await httpPost('/projects', project);

    runInAction(() => {
      this.projects.push(new Project(json.id, name, settings));
      this.select(json.id);
    });
  }

  async open(id: number) {
    const json = await httpGet(`/projects/${id}`);
    const project = new Project(json.id, json.name, JSON.parse(json.settings));
    runInAction(() => {
      this.projects = [
        ...this.projects.filter(project => project.id !== id),
        project,
      ];
      this.select(json.id);
    });
  }

  select(id?: number) {
    this.currentId = id;
  }

  move(fromId: number, toId?: number) {
    const from = this.projects.findIndex(p => p.id === fromId);
    const to = toId ? this.projects.findIndex(p => p.id === toId) : undefined;
    if (from !== -1 && to !== -1) {
      this.projects = arrayMove(this.projects, from, to);
    }
  }

  close(id: number) {
    this.projects = this.projects.filter(project => project.id !== id);

    if (id === this.currentId) {
      this.currentId = this.projects[0]?.id;
    }
  }
}

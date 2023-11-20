import { makeAutoObservable, runInAction } from 'mobx';
import { Project } from './project';
import { arrayMove, defaultProjectSettings } from '../helpers';
import { getUrl } from '../config';

export class ProjectStore {
  projects: Project[] = [];
  currentId: number | undefined = undefined;

  constructor() {
    makeAutoObservable(this);
  }

  get current() {
    return this.projects.find(project => project.id === this.currentId);
  }

  async create(name: string) {
    const settings = defaultProjectSettings();
    const project = {
      name,
      settings: JSON.stringify(settings),
    };

    const res = await fetch(getUrl('/projects'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    const json = await res.json();

    runInAction(() => {
      this.projects.push(new Project(json.id, name, settings));
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

import { makeAutoObservable } from 'mobx';
import { Project } from './project';
import { arrayMove } from '../helpers';

export class ProjectStore {
  projects = [new Project('test_project'), new Project('test_project2')];
  currentId: string | undefined = 'test_project';

  constructor() {
    makeAutoObservable(this);
  }

  get current() {
    return this.projects.find(project => project.id === this.currentId);
  }

  select(id?: string) {
    this.currentId = id;
  }

  move(fromId: string, toId?: string) {
    const from = this.projects.findIndex(p => p.id === fromId);
    const to = toId ? this.projects.findIndex(p => p.id === toId) : undefined;
    if (from !== -1 && to !== -1) {
      this.projects = arrayMove(this.projects, from, to);
    }
  }

  close(id: string) {
    this.projects = this.projects.filter(project => project.id !== id);

    if (id === this.currentId) {
      this.currentId = this.projects[0]?.id;
    }
  }
}

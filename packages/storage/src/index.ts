import path from 'path';

import { Projects } from './projects.js';
import { Models } from './models.js';

export class Storage {
  projects;
  models;

  constructor(public dataRoot: string) {
    this.projects = new Projects(this.projectsDir);
    this.models = new Models(this.modelsDir);
  }

  get projectsDir() {
    return path.join(this.dataRoot, 'projects');
  }

  get modelsDir() {
    return path.join(this.dataRoot, 'models');
  }
}

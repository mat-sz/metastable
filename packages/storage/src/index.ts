import path from 'path';

import { Projects } from './projects.js';
import { Models } from './models.js';
import { Config } from './config.js';

export class Storage {
  projects;
  models;
  config;

  constructor(public dataRoot: string) {
    this.projects = new Projects(this.projectsDir);
    this.models = new Models(this.modelsDir);
    this.config = new Config(this.configPath);
  }

  get configPath() {
    return path.join(this.dataRoot, 'config.json');
  }

  get projectsDir() {
    return path.join(this.dataRoot, 'projects');
  }

  get modelsDir() {
    return path.join(this.dataRoot, 'models');
  }
}

import path from 'path';

import { Models } from './models.js';
import { Config } from './config.js';

export class Storage {
  models;
  config;

  constructor(public dataRoot: string) {
    this.models = new Models(this.modelsDir);
    this.config = new Config(this.configPath);
  }

  async init() {
    await this.models.init();
  }

  get configPath() {
    return path.join(this.dataRoot, 'config.json');
  }

  get modelsDir() {
    return path.join(this.dataRoot, 'models');
  }
}

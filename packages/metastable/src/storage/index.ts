import path from 'path';

import { Config } from './config.js';

export class Storage {
  config;

  constructor(public dataRoot: string) {
    this.config = new Config(this.configPath);
  }

  get configPath() {
    return path.join(this.dataRoot, 'config.json');
  }
}

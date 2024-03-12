import path from 'path';
import { Project } from '@metastable/types';
import { mkdir } from 'fs/promises';
import { rimraf } from 'rimraf';

import { directorySize } from '../helpers/fs.js';
import {
  Metadata,
  EntityRepository,
  ImageEntity,
  DirectoryEntity,
} from './common.js';

export class ProjectEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata(path.join(this._path, 'project.json'));
  settings = new Metadata(path.join(this._path, 'settings.json'));

  input = new EntityRepository(path.join(this._path, 'input'), ImageEntity);
  output = new EntityRepository(path.join(this._path, 'output'), ImageEntity);
  tempPath = path.join(this._path, 'temp');

  constructor(_path: string) {
    super(_path);
  }

  async load(): Promise<void> {
    await this.metadata.refresh();
    await mkdir(this.input.path, { recursive: true });
    await mkdir(this.output.path, { recursive: true });
  }

  async cleanup() {
    await rimraf(this.tempPath);
  }

  async resetTemp() {
    await rimraf(this.tempPath);
    await mkdir(this.tempPath, { recursive: true });
  }

  async json(withSettings: true): Promise<Project>;
  async json(withSettings?: false): Promise<Omit<Project, 'settings'>>;
  async json(
    withSettings = false,
  ): Promise<Project | Omit<Project, 'settings'>> {
    await this.load();
    const outputs = await this.output.all();

    const json: any = {
      type: 'simple',
      ...this.metadata.json!,
      id: this.name,
      name: this.name,
      lastOutput: outputs[outputs.length - 1]?.name,
      outputs: outputs.length,
      size: await directorySize(this._path),
    };

    if (withSettings) {
      json.settings = await this.settings.get();
    }

    return json;
  }
}

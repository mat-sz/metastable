import { mkdir } from 'fs/promises';
import path from 'path';

import { Project } from '@metastable/types';
import { rimraf } from 'rimraf';

import {
  DirectoryEntity,
  EntityRepository,
  ImageEntity,
  Metadata,
} from './common.js';
import { directorySize } from '../helpers/fs.js';

export class ProjectEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata<{ type?: string; temporary?: boolean }>(
    path.join(this._path, 'project.json'),
  );
  settings = new Metadata(path.join(this._path, 'settings.json'));
  ui = new Metadata<any>(path.join(this._path, 'ui.json'), {});

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

  async json(full = false): Promise<Project> {
    await this.load();
    const outputs = await this.output.all();
    const lastOutput = outputs[outputs.length - 1];

    const json: Project = {
      type: 'simple',
      ...this.metadata.json!,
      id: this.name,
      name: this.name,
      lastOutput: await lastOutput?.json(),
      outputCount: outputs.length,
      size: await directorySize(this._path),
    };

    if (full) {
      json.settings = await this.settings.get();
      json.ui = await this.ui.get();
    }

    return json;
  }
}

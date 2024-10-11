import { mkdir } from 'fs/promises';
import path from 'path';

import { Project, ProjectFileType } from '@metastable/types';
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

  files: Record<ProjectFileType, EntityRepository<typeof ImageEntity>>;
  tempPath = path.join(this._path, 'temp');

  constructor(_path: string) {
    super(_path);

    const files = {} as any;
    for (const key of Object.values(ProjectFileType)) {
      files[key] = new EntityRepository(
        path.join(this._path, key),
        ImageEntity,
      );
    }
    this.files = files;
  }

  async load(): Promise<void> {
    await this.metadata.refresh();

    for (const key of Object.values(ProjectFileType)) {
      await mkdir(this.files[key].path, { recursive: true });
    }
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
    const outputs = await this.files.output.all();
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

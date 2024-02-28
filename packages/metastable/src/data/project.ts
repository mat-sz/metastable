import { Dirent } from 'fs';
import path from 'path';
import { Project } from '@metastable/types';

import { directorySize } from '../helpers/fs.js';
import {
  BaseEntity,
  Metadata,
  EntityRepository,
  ImageEntity,
  EntityClass,
} from './common.js';

export class ProjectEntity extends BaseEntity {
  data = new Metadata(path.join(this._path, 'project.json'));
  settings = new Metadata(path.join(this._path, 'settings.json'));

  input = new EntityRepository(path.join(this._path, 'input'), ImageEntity);
  output = new EntityRepository(path.join(this._path, 'output'), ImageEntity);

  constructor(_path: string) {
    super(_path);
  }

  assign(data: any): void {}

  async load(): Promise<void> {
    await this.data.get();
  }

  async json(): Promise<Omit<Project, 'settings'>> {
    await this.load();
    const outputs = await this.output.all();

    return {
      type: 'simple',
      ...this.data.json!,
      id: this.name,
      name: this.name,
      lastOutput: outputs[outputs.length - 1]?.name,
      outputs: outputs.length,
      size: await directorySize(this._path),
    };
  }

  async save(): Promise<void> {}

  async remove(): Promise<void> {}

  static async fromDirent<T extends BaseEntity>(
    this: EntityClass<T>,
    dirent: Dirent,
  ): Promise<T> {
    if (!dirent.isDirectory()) {
      throw new Error('Not a directory.');
    }

    return await super.fromDirent<T>(dirent);
  }
}

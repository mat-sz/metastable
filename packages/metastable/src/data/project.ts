import { mkdir } from 'fs/promises';
import path from 'path';

import { Project, ProjectFileType } from '@metastable/types';
import chokidar from 'chokidar';
import { rimraf } from 'rimraf';

import {
  DirectoryEntity,
  EntityRepository,
  ImageEntity,
  Metadata,
} from './common.js';
import { directorySize, isPathIn } from '../helpers/fs.js';

export class ProjectImageEntity extends ImageEntity {
  type: ProjectFileType;

  constructor(_path: string) {
    super(_path);
    this.type = path.basename(this.baseDir) as ProjectFileType;
  }

  async json(withMetadata = false) {
    return {
      name: this.name,
      image: this.image,
      path: this.path,
      metadata: withMetadata ? await this.metadata.get() : undefined,
      internalUrl: `metastable://current_project/${encodeURIComponent(this.type)}/${encodeURIComponent(this.name)}`,
    };
  }
}

export class ProjectEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata<{ type?: string; temporary?: boolean }>(
    path.join(this._path, 'project.json'),
  );
  settings = new Metadata(path.join(this._path, 'settings.json'));
  ui = new Metadata<any>(path.join(this._path, 'ui.json'), {});

  files: Record<ProjectFileType, EntityRepository<typeof ProjectImageEntity>>;
  tempPath = path.join(this._path, 'temp');

  constructor(_path: string) {
    super(_path);

    const files = {} as any;
    for (const key of Object.values(ProjectFileType)) {
      files[key] = new EntityRepository(
        path.join(this._path, key),
        ProjectImageEntity,
      );
    }
    this.files = files;
  }

  watch(onFilesChange: (type: ProjectFileType) => void) {
    const timeout: Record<ProjectFileType, any> = {} as any;
    const watcher = chokidar
      .watch(this._path, {})
      .on('all', (event: string, path: string) => {
        if (!['add', 'change', 'unlink'].includes(event)) {
          return;
        }

        let type: ProjectFileType | undefined = undefined;
        for (const [key, files] of Object.entries(this.files)) {
          if (isPathIn(files.path, path)) {
            type = key as ProjectFileType;
            break;
          }
        }

        if (type) {
          clearTimeout(timeout[type]);
          timeout[type] = setTimeout(() => {
            onFilesChange(type);
          }, 250);
        }
      });
    return watcher;
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

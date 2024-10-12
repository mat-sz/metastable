import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

import { Project, ProjectFileType } from '@metastable/types';
import chokidar from 'chokidar';
import { nanoid } from 'nanoid';
import { rimraf } from 'rimraf';

import {
  DirectoryEntity,
  EntityRepository,
  ImageEntity,
  Metadata,
} from './common.js';
import { directorySize, getAvailableName, isPathIn } from '../helpers/fs.js';
import { TypedEventEmitter } from '../types.js';

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

  metadata = new Metadata<{ id: string; type?: string; temporary?: boolean }>(
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

  get id() {
    // TODO: Figure out why we're having race conditions here.
    return this.metadata.json?.id || '';
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

    if (!this.metadata.json?.id) {
      await this.metadata.set({
        ...this.metadata.json!,
        id: nanoid(),
      });
    }

    for (const key of Object.values(ProjectFileType)) {
      await fs.mkdir(this.files[key].path, { recursive: true });
    }
  }

  async cleanup() {
    await rimraf(this.tempPath);
  }

  async resetTemp() {
    await rimraf(this.tempPath);
    await fs.mkdir(this.tempPath, { recursive: true });
  }

  async json(full = false): Promise<Project> {
    await this.load();
    const outputs = await this.files.output.all();
    const lastOutput = outputs[outputs.length - 1];

    const json: Project = {
      type: 'simple',
      ...this.metadata.json!,
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

type ProjectRepositoryEvents = {
  change: () => void;
};
export class ProjectRepository extends (EventEmitter as {
  new (): TypedEventEmitter<ProjectRepositoryEvents>;
}) {
  private cache: ProjectEntity[] | undefined = undefined;

  constructor(private baseDir: string) {
    super();

    let timeout: any = undefined;
    chokidar.watch(baseDir, {}).on('all', (event: string) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }

      this.cache = undefined;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.emit('change');
      }, 250);
    });
  }

  get path() {
    return this.baseDir;
  }

  getEntityPath(name: string) {
    return path.join(this.baseDir, name);
  }

  private async getAvailableEntityName(name: string) {
    return await getAvailableName(this.baseDir, name, true);
  }

  private async getAvailableEntityPath(name: string) {
    return this.getEntityPath(await this.getAvailableEntityName(name));
  }

  async refresh() {
    await fs.mkdir(this.path, { recursive: true });

    const items = await fs.readdir(this.baseDir, { withFileTypes: true });

    const promises = items.map(item => ProjectEntity.fromDirent(item));

    const projects = (await Promise.allSettled(promises))
      .filter(entity => entity.status === 'fulfilled')
      .map(result => result.value) as ProjectEntity[];
    this.cache = projects;
    return projects;
  }

  async all() {
    if (!this.cache) {
      return await this.refresh();
    }

    return this.cache;
  }

  async get(id: string) {
    const all = await this.all();
    const project = all.find(project => project.id === id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  async create(name: string) {
    await fs.mkdir(this.path, { recursive: true });

    const project = (await ProjectEntity.create(
      await this.getAvailableEntityPath(name),
    )) as ProjectEntity;
    this.cache = undefined;
    return project;
  }

  async rename(id: string, newName: string) {
    const project = await this.get(id);
    newName = await this.getAvailableEntityName(newName);
    await fs.rename(project.path, this.getEntityPath(newName));
    this.cache = undefined;
    return await this.get(id);
  }

  async getOrRename(id: string, newName?: string) {
    if (newName) {
      return await this.rename(id, newName);
    }

    return await this.get(id);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.get(id);
    await entity.delete();
    this.cache = undefined;
  }
}

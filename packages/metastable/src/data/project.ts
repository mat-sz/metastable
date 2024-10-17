import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

import { MRN } from '@metastable/common';
import { Project, ProjectFileType } from '@metastable/types';
import chokidar from 'chokidar';
import { nanoid } from 'nanoid';

import {
  DirectoryEntity,
  EntityRepository,
  ImageEntity,
  Metadata,
} from './common.js';
import { directorySize, getAvailableName, rmdir } from '../helpers/fs.js';
import { TypedEventEmitter } from '../types.js';

export class ProjectImageEntity extends ImageEntity {
  type: ProjectFileType;

  constructor(_path: string) {
    super(_path);
    this.type = path.basename(this.baseDir) as ProjectFileType;
  }

  static get mrnBaseSegments(): string[] {
    return ['invalid'];
  }

  get mrn() {
    return MRN.serialize({
      segments: [...(this.constructor as any).mrnBaseSegments, this.name],
    });
  }

  async json(withMetadata = false) {
    return {
      name: this.name,
      image: this.image,
      path: this.path,
      metadata: withMetadata ? await this.metadata.get() : undefined,
      mrn: this.mrn,
    };
  }
}

export class ProjectEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata<{ id: string; type?: string; draft?: boolean }>(
    path.join(this._path, 'project.json'),
  );
  settings = new Metadata(path.join(this._path, 'settings.json'));
  ui = new Metadata<any>(path.join(this._path, 'ui.json'), {});

  files: Record<ProjectFileType, EntityRepository<typeof ProjectImageEntity>>;
  tempPath = path.join(this._path, 'temp');

  constructor(_path: string) {
    super(_path);

    const files = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const project = this;
    for (const key of Object.values(ProjectFileType)) {
      files[key] = new EntityRepository(
        path.join(this._path, key),
        class ExtendedProjectImageEntity extends ProjectImageEntity {
          static get mrnBaseSegments(): string[] {
            return ['project', project.id, 'file', key];
          }
        },
      );
    }
    this.files = files;
  }

  get id() {
    // TODO: Figure out why we're having race conditions here.
    return this.metadata.json?.id || '';
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
    await rmdir(this.tempPath);
  }

  async resetTemp() {
    await rmdir(this.tempPath);
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
  projectChange: (id: string, type: ProjectFileType) => void;
};
export class ProjectRepository extends (EventEmitter as {
  new (): TypedEventEmitter<ProjectRepositoryEvents>;
}) {
  private cache: ProjectEntity[] | undefined = undefined;
  private watcher: chokidar.FSWatcher | undefined = undefined;

  constructor(private baseDir: string) {
    super();
  }

  private initWatcher() {
    if (this.watcher) {
      return false;
    }

    let timeout: any = undefined;
    const timeoutProject: Record<string, any> = {};
    this.watcher = chokidar
      .watch(this.baseDir, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
      })
      .on('all', async (event: string, filePath: string) => {
        if (['addDir', 'unlinkDir'].includes(event)) {
          this.cache = undefined;
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.emit('change');
          }, 250);
        }

        if (['add', 'unlink'].includes(event)) {
          try {
            const relative = path.relative(this.baseDir, filePath);
            const split = relative.split(path.sep);
            const [name, type] = split;

            if (name && type) {
              const project = await this.getByName(name);
              if (!project.id) {
                return;
              }

              clearTimeout(timeoutProject[project.id]);
              timeoutProject[project.id] = setTimeout(() => {
                this.emit('projectChange', project.id, type as ProjectFileType);
              }, 250);
            }
          } catch {}
        }
      });
  }

  async cleanup() {
    await this.watcher?.close();
    const projects = await this.refresh();
    for (const project of projects) {
      try {
        const data = await project.metadata.get();
        if (data.draft) {
          await project.delete();
        }
      } catch {}
    }
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

    const promises = items.map(async item => {
      const project = await ProjectEntity.fromDirent(item);
      await project.load();
      return project;
    });

    const projects = (await Promise.allSettled(promises))
      .filter(entity => entity.status === 'fulfilled')
      .map(result => result.value) as ProjectEntity[];
    this.cache = projects;
    this.initWatcher();

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

  async getByName(name: string) {
    const project = this.cache?.find(project => project.name === name);
    if (project) {
      return project;
    }

    return (await ProjectEntity.fromPath(
      this.getEntityPath(name),
    )) as ProjectEntity;
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

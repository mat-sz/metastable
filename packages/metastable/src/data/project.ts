import { EventEmitter } from 'events';
import { FSWatcher, watch } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { MRN, MRNDataParsed } from '@metastable/common/mrn';
import { Project, ProjectFileType, ProjectType } from '@metastable/types';
import { nanoid } from 'nanoid';

import { debounce } from '#helpers/common.js';
import {
  exists,
  getAvailableName,
  METADATA_DIRECTORY_NAME,
  removeFileExtension,
  rmdir,
} from '#helpers/fs.js';
import {
  DirectoryEntity,
  EntityRepository,
  ImageEntity,
  Metadata,
} from './common.js';

export class ProjectImageEntity extends ImageEntity {
  type: ProjectFileType;
  settings;

  constructor(_path: string) {
    super(_path);
    this.type = path.basename(this.baseDir) as ProjectFileType;
    this.settings = new Metadata(this.settingsFilePath, {});
  }

  get metadataFilePath() {
    return path.join(this.metadataPath, `${this.name}.metadata.json`);
  }

  get settingsFilePath() {
    return path.join(this.metadataPath, `${this.name}.settings.json`);
  }

  static get mrnBaseSegments(): string[] {
    return ['invalid'];
  }

  get mrn() {
    return MRN.serialize({
      segments: [...(this.constructor as any).mrnBaseSegments, this.name],
    });
  }

  async load(): Promise<void> {
    const oldMetadataFilePath = path.join(
      this.metadataPath,
      `${this.name}.json`,
    );
    if (
      this.type === ProjectFileType.OUTPUT &&
      (await exists(oldMetadataFilePath)) &&
      !(await exists(this.settingsFilePath))
    ) {
      await fs.rename(oldMetadataFilePath, this.settingsFilePath);
    }
  }

  async delete(): Promise<void> {
    await super.delete();
    await this.settings.delete();
  }

  async json(withSettings = false) {
    return {
      name: this.name,
      path: this.path,
      metadata: await this.metadata.get(),
      settings: withSettings ? await this.settings.get() : undefined,
      mrn: this.mrn,
    };
  }
}

export class ProjectEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata<{ id: string; type?: ProjectType; draft?: boolean }>(
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
    return this.metadata.json?.id || '';
  }

  async load(): Promise<void> {
    await this.metadata.get(true);

    if (!this.metadata.json?.id) {
      await this.metadata.set({
        ...this.metadata.json!,
        id: nanoid(),
      });
    }

    await Promise.all(
      Object.values(ProjectFileType).map(key =>
        fs.mkdir(this.files[key].path, { recursive: true }),
      ),
    );
  }

  async cleanup() {
    await rmdir(this.tempPath);
  }

  async resetTemp() {
    await rmdir(this.tempPath);
    await fs.mkdir(this.tempPath, { recursive: true });
  }

  async lastOutput() {
    const repository = this.files.output;
    const dirents = await fs.readdir(repository.path, { withFileTypes: true });

    let max = 0;
    let maxName = undefined;
    for (const dirent of dirents) {
      const fileNum = parseInt(removeFileExtension(dirent.name));
      if (!isNaN(fileNum) && fileNum > max) {
        max = fileNum;
        maxName = dirent.name;
      }
    }

    if (maxName) {
      return await repository.get(maxName);
    }
  }

  async json(full = false): Promise<Project> {
    await this.load();
    const lastOutput = await this.lastOutput();

    const json: Project = {
      type: ProjectType.SIMPLE,
      ...this.metadata.json!,
      name: this.name,
      lastOutput: await lastOutput?.json(),
    };

    if (full) {
      json.settings = await this.settings.get();
      json.ui = await this.ui.get();
    }

    return json;
  }
}

type ProjectRepositoryEvents = {
  change: [];
  fileChange: [id: string, type: ProjectFileType];
};

export class ProjectRepository extends EventEmitter<ProjectRepositoryEvents> {
  private cache: ProjectEntity[] | undefined = undefined;
  private watcher: FSWatcher | undefined = undefined;

  constructor(private baseDir: string) {
    super();
  }

  private initWatcher() {
    if (this.watcher) {
      return false;
    }

    const onChange = debounce(() => this.emit('change'), 250);
    const onFileChange = debounce(
      (projectId: string, type: ProjectFileType) =>
        this.emit('fileChange', projectId, type),
      250,
    );

    this.watcher = watch(
      this.baseDir,
      {
        persistent: false,
        recursive: true,
      },
      async (_, filePath) => {
        if (!filePath) {
          return;
        }

        try {
          const isTopLevel = !filePath.includes(path.sep);
          if (isTopLevel) {
            this.cache = undefined;
            onChange();
          } else {
            const split = filePath.split(path.sep);
            const [name, type] = split;

            if (
              name &&
              type &&
              Object.values(ProjectFileType).includes(type as any) &&
              split[3] !== METADATA_DIRECTORY_NAME
            ) {
              const project = await this.getByName(name);
              if (!project.id) {
                return;
              }

              onFileChange(project.id, type as ProjectFileType);
            }
          }
        } catch {}
      },
    );
  }

  async cleanup() {
    await this.deleteDrafts();
    this.watcher?.close();
  }

  async deleteDrafts() {
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

    const promises = items.map(item => ProjectEntity.fromDirent(item));

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

  async resolve(parsed: MRNDataParsed) {
    const project = await this.get(parsed.segments[1]);
    const subscope = parsed.segments[2];
    switch (subscope) {
      case 'file': {
        const type = parsed.segments[3] as ProjectFileType;
        if (!Object.values(ProjectFileType).includes(type)) {
          throw new Error(`Invalid project file type - ${type}`);
        }

        const file = await project.files[type].get(parsed.segments[4]);
        const size = parsed.query.get('size') || 'full';
        switch (size) {
          case 'full':
            return file.path;
          case 'thumbnail':
            return file.thumbnailPath;
          default:
            throw new Error(`Invalid size option value: ${size}`);
        }
      }
      default:
        throw new Error(`Invalid project sub-scope: ${subscope}`);
    }
  }
}

import { Dirent } from 'fs';
import fs, { mkdir, stat } from 'fs/promises';
import path from 'path';

import {
  exists,
  getAvailableName,
  getMetadataDirectory,
  IMAGE_EXTENSIONS,
  rmdir,
  tryUnlink,
} from '../helpers/fs.js';
import { generateThumbnail, getThumbnailPath } from '../helpers/image.js';

export type EntityClass<T extends BaseEntity> = {
  new (...args: any[]): T;
  readonly isDirectory: boolean;
  fromDirent: (dirent: Dirent) => Promise<T>;
  fromPath: (filePath: string) => Promise<T>;
  create: (filePath: string) => Promise<T>;
};

export class Metadata<T> {
  private _json: T | undefined;

  constructor(
    protected path: string,
    private fallback?: T,
  ) {}

  get json() {
    return this._json;
  }

  async get(force = false): Promise<T> {
    if (!force && this._json) {
      return this._json;
    }

    try {
      const data = await fs.readFile(this.path, { encoding: 'utf-8' });
      if (data) {
        const json = JSON.parse(data);
        this._json = json;
        return json;
      }
    } catch {}

    if (this.fallback) {
      const json = this.fallback;
      this._json = json;
      return json;
    } else {
      throw new Error(`Unable to read metadata from: ${this.path}`);
    }
  }

  async set(data: T) {
    try {
      await fs.writeFile(this.path, JSON.stringify(data));
      this._json = data;
    } catch {
      throw new Error(`Unable to write metadata to: ${this.path}`);
    }
  }

  async update(data: Partial<T>) {
    const current = await this.get();
    await this.set({ ...current, ...data });
  }

  async delete() {
    await tryUnlink(this.path);
  }
}
export class BaseEntity {
  static readonly isDirectory: boolean = false;
  baseDir;
  name;

  // TODO: Make private?
  _path: string;

  constructor(_path: string) {
    this._path = _path;
    this.baseDir = path.dirname(_path);
    this.name = path.basename(_path);
  }

  get path() {
    return this._path;
  }

  async load(): Promise<void> {}

  async json() {
    return { name: this.name };
  }

  async delete(): Promise<void> {}

  static async fromDirent<T extends BaseEntity>(
    this: EntityClass<T>,
    dirent: Dirent,
  ): Promise<T> {
    return await this.fromPath(path.join(dirent.parentPath, dirent.name));
  }

  static async fromPath<T extends BaseEntity>(
    this: EntityClass<T>,
    filePath: string,
  ): Promise<T> {
    const asset = new this(filePath);
    await asset.load();
    return asset;
  }

  static async create<T extends BaseEntity>(
    this: EntityClass<T>,
    filePath: string,
  ): Promise<T> {
    return new this(filePath);
  }
}

export class DirectoryEntity extends BaseEntity {
  static readonly isDirectory = true;

  metadata = new Metadata(path.join(this._path, 'metadata.json'));

  constructor(_path: string) {
    super(_path);
  }

  async load(): Promise<void> {
    await this.metadata.get(true);
  }

  static async fromDirent<T extends BaseEntity>(
    this: EntityClass<T>,
    dirent: Dirent,
  ): Promise<T> {
    if (!dirent.isDirectory()) {
      throw new Error('Not a directory.');
    }

    return await super.fromDirent<T>(dirent);
  }

  static async create<T extends BaseEntity>(
    this: EntityClass<T>,
    filePath: string,
  ): Promise<T> {
    const entity = await super.create<T>(filePath);
    await mkdir(entity.path, { recursive: true });
    return entity;
  }

  async delete(): Promise<void> {
    await rmdir(this.path);
  }
}

export class FileEntity extends BaseEntity {
  metadata;
  size = 0;

  constructor(_path: string) {
    super(_path);

    this.metadata = new Metadata(
      path.join(this.metadataPath, `${this.name}.json`),
      {},
    );
  }

  get metadataPath() {
    return getMetadataDirectory(this.path);
  }

  async load(): Promise<void> {
    if (!this.size) {
      this.size = (await stat(this.path)).size;
    }

    await this.metadata.get(true);
  }

  async json(): Promise<{ name: string; metadata?: any }> {
    return { name: this.name, metadata: await this.metadata.get() };
  }

  async delete(): Promise<void> {
    await tryUnlink(this.path);
    await this.metadata.delete();
  }

  static async fromDirent<T extends BaseEntity>(
    this: EntityClass<T>,
    dirent: Dirent,
  ): Promise<T> {
    if (!dirent.isFile()) {
      throw new Error('Not a file.');
    }

    return await super.fromDirent<T>(dirent);
  }
}

export class ImageEntity extends FileEntity {
  constructor(_path: string) {
    super(_path);
  }

  get thumbnailPath() {
    return getThumbnailPath(this.path);
  }

  static async fromPath<T extends BaseEntity>(
    this: EntityClass<T>,
    filePath: string,
  ): Promise<T> {
    const base = path.basename(filePath);
    if (base.includes('.thumb.')) {
      throw new Error('Thumbnail.');
    }

    const split = base.split('.');
    const isImage = IMAGE_EXTENSIONS.includes(split[split.length - 1]);
    if (!isImage) {
      throw new Error(`Not a valid image.`);
    }

    await generateThumbnail(filePath);

    const oldThumbnailPath = getThumbnailPath(filePath, 'jpg');
    await tryUnlink(oldThumbnailPath);

    return await super.fromPath<T>(filePath);
  }

  async write(data: Uint8Array) {
    await fs.writeFile(this.path, data);
    await generateThumbnail(this.path);
  }

  async delete(): Promise<void> {
    await super.delete();
    await tryUnlink(this.thumbnailPath);
  }

  async json(withMetadata = false) {
    return {
      name: this.name,
      mrn: 'mrn:invalid',
      path: this.path,
      metadata: withMetadata ? await this.metadata.get() : undefined,
    };
  }
}

type EntityType<T> = T extends new (...args: any[]) => infer A ? A : never;

export class EntityRepository<
  TClass extends EntityClass<BaseEntity>,
  TEntity extends BaseEntity = EntityType<TClass>,
> {
  constructor(
    protected baseDir: string,
    private entityClass: TClass,
  ) {}

  get path() {
    return this.baseDir;
  }

  getEntityPath(name: string) {
    return path.join(this.baseDir, name);
  }

  private async getAvailableEntityName(name: string) {
    return await getAvailableName(
      this.baseDir,
      name,
      this.entityClass.isDirectory,
    );
  }

  private async getAvailableEntityPath(name: string) {
    return this.getEntityPath(await this.getAvailableEntityName(name));
  }

  async all(): Promise<TEntity[]> {
    await mkdir(this.path, { recursive: true });

    const items = await fs.readdir(this.baseDir, { withFileTypes: true });

    const promises = items.map(item => this.entityClass.fromDirent(item));

    return (await Promise.allSettled(promises))
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value) as TEntity[];
  }

  async exists(name: string): Promise<boolean> {
    return await exists(this.getEntityPath(name));
  }

  async get(name: string): Promise<TEntity> {
    return (await this.entityClass.fromPath(
      this.getEntityPath(name),
    )) as TEntity;
  }

  async create(name: string): Promise<TEntity> {
    await mkdir(this.path, { recursive: true });

    return (await this.entityClass.create(
      await this.getAvailableEntityPath(name),
    )) as TEntity;
  }

  async rename(oldName: string, newName: string): Promise<TEntity> {
    newName = await this.getAvailableEntityName(newName);
    await fs.rename(this.getEntityPath(oldName), this.getEntityPath(newName));
    return await this.get(newName);
  }

  async getOrRename(name: string, newName?: string) {
    if (newName) {
      return await this.rename(name, newName);
    }

    return await this.get(name);
  }

  async delete(name: string): Promise<void> {
    const entity = await this.get(name);
    await entity.delete();
  }
}

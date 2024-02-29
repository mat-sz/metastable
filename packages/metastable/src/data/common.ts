import { Dirent } from 'fs';
import fs, { mkdir } from 'fs/promises';
import path from 'path';

import {
  IMAGE_EXTENSIONS,
  freeDirName,
  getMetadataDirectory,
} from '../helpers/fs.js';
import { generateThumbnail, getThumbnailPath } from '../helpers/image.js';

export type EntityClass<T extends BaseEntity> = {
  new (...args: any[]): T;
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

  async get(): Promise<T> {
    if (this._json) {
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
    } catch {
      throw new Error(`Unable to write metadata to: ${this.path}`);
    }
  }

  async update(data: Partial<T>) {
    const current = await this.get();
    await this.set({ ...current, ...data });
  }

  async refresh() {
    this._json = undefined;
    await this.get();
  }
}
export class BaseEntity {
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

  static async fromDirent<T extends BaseEntity>(
    this: EntityClass<T>,
    dirent: Dirent,
  ): Promise<T> {
    return this.fromPath(path.join(dirent.path, dirent.name));
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

export class FileEntity extends BaseEntity {
  data;

  constructor(_path: string) {
    super(_path);

    this.data = new Metadata(
      path.join(getMetadataDirectory(this.path), `${this.name}.json`),
      {},
    );
  }

  async load(): Promise<void> {
    await this.data.get();
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

    return await super.fromPath<T>(filePath);
  }
}

type EntityType<T> = T extends new (...args: any[]) => infer A ? A : never;

export class EntityRepository<
  TClass extends EntityClass<BaseEntity>,
  TEntity = EntityType<TClass>,
> {
  constructor(
    private baseDir: string,
    private assetClass: TClass,
  ) {}

  get path() {
    return this.baseDir;
  }

  async all(): Promise<TEntity[]> {
    await mkdir(this.path, { recursive: true });

    const items = await fs.readdir(this.baseDir, { withFileTypes: true });

    const promises = items.map(async item => {
      try {
        return await this.assetClass.fromDirent(item);
      } catch {
        return undefined;
      }
    });

    return (await Promise.all(promises)).filter(
      entity => !!entity,
    ) as TEntity[];
  }

  async get(name: string): Promise<TEntity> {
    return (await this.assetClass.fromPath(
      path.join(this.baseDir, name),
    )) as TEntity;
  }

  async create(name: string): Promise<TEntity> {
    await mkdir(this.path, { recursive: true });

    const newName = await freeDirName(this.baseDir, name);
    return new this.assetClass(path.join(this.baseDir, newName)) as TEntity;
  }
}

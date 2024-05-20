import path from 'path';

import { DirectoryEntity, Metadata } from './common.js';

export interface BundleInfo {
  name: string;
  label: string;
  version: string;
  dependencies?: Record<string, string>;
}

export interface BundleInfoAPI extends BundleInfo {
  downloads?: string[] | Record<string, string[]>;
}

export interface BundleInfoInstalled extends BundleInfo {
  exports?: Record<string, string>;
}

export class BundleEntity extends DirectoryEntity {
  static readonly isDirectory = true;

  metadata = new Metadata<BundleInfoInstalled>(
    path.join(this._path, 'bundle.json'),
  );

  constructor(_path: string) {
    super(_path);
  }

  async load(): Promise<void> {
    await this.metadata.refresh();
  }

  async json(): Promise<BundleInfoInstalled> {
    await this.load();
    return { ...this.metadata.json! };
  }
}

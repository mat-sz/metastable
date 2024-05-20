import path from 'path';

import { BundleInfoInstalled } from './types.js';
import { BundleEntity } from '../data/bundle.js';
import { EntityRepository } from '../data/common.js';

export class BundleManager {
  bundlesDir: string;
  repository;

  constructor(dataRoot: string) {
    this.bundlesDir = path.join(dataRoot, 'bundles');
    this.repository = new EntityRepository(this.bundlesDir, BundleEntity);
  }

  async installed(): Promise<BundleInfoInstalled[]> {
    const bundles = await this.repository.all();
    return await Promise.all(bundles.map(bundle => bundle.json()));
  }

  async available() {}
}

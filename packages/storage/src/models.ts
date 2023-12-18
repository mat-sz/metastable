import path from 'path';
import fs from 'fs/promises';
import { FileInfo } from '@metastable/types';
import { isPathIn, walk } from '@metastable/fs-helpers';

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];

export class Models {
  constructor(private modelsDir: string) {}

  async all() {
    const modelsDir = this.modelsDir;
    const subdirs = await fs.readdir(modelsDir, {
      withFileTypes: true,
    });

    const models: Record<string, FileInfo[]> = {};

    for (const dir of subdirs) {
      if (!dir.isDirectory()) {
        continue;
      }

      if (dir.name.startsWith('.')) {
        continue;
      }

      models[dir.name] = await walk(
        path.join(modelsDir, dir.name),
        '',
        MODEL_EXTENSIONS,
      );
    }

    return models;
  }

  async type(type: string) {
    return await walk(path.join(this.modelsDir, type), '', MODEL_EXTENSIONS);
  }

  async find(list: FileInfo[], startsWith: string) {
    for (const model of list) {
      if (
        model.name.startsWith(startsWith) ||
        model.name.includes(path.sep + startsWith)
      ) {
        return model.name;
      }
    }

    return undefined;
  }

  dir(type: string) {
    return path.join(this.modelsDir, type);
  }

  path(type: string, name: string) {
    const modelsDir = this.modelsDir;
    const result = path.join(modelsDir, type, name);
    if (!isPathIn(modelsDir, result)) {
      return undefined;
    }
    return result;
  }
}

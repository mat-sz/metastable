import path from 'path';
import fs from 'fs/promises';
import { FileInfo, Model, ModelType } from '@metastable/types';

import {
  tryUnlink,
  walk,
  JSONFile,
  removeFileExtension,
  IMAGE_EXTENSIONS,
  exists,
} from '../helpers/fs.js';

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];
const MODEL_TYPES = Object.values(ModelType);

function isModel(name: string) {
  return MODEL_EXTENSIONS.includes(name.split('.').pop()!);
}

export class Models {
  constructor(private modelsDir: string) {}

  private modelFile(
    type: string,
    ...parts: string[]
  ): JSONFile<Omit<Model, 'file' | 'image'>> {
    const name = parts[parts.length - 1];
    parts[parts.length - 1] += '.json';
    return new JSONFile(this.metaPath(type, ...parts), {
      name: removeFileExtension(name),
    });
  }

  async init() {
    for (const type of MODEL_TYPES) {
      await fs.mkdir(this.dir(type), { recursive: true });
    }
  }

  async all() {
    const modelsDir = this.modelsDir;
    const subdirs = await fs.readdir(modelsDir, {
      withFileTypes: true,
    });

    const models: Record<string, Model[]> = {};

    for (const dir of subdirs) {
      if (!dir.isDirectory()) {
        continue;
      }

      if (dir.name.startsWith('.')) {
        continue;
      }

      const files = await walk(path.join(modelsDir, dir.name), '');
      const fileNames = files.map(file => file.name);

      if (files.length) {
        models[dir.name] = [];
        for (const file of files) {
          const base = path.basename(file.name);
          if (!isModel(base)) {
            continue;
          }

          const modelFile = this.modelFile(dir.name, ...file.parts, base);
          const data: Omit<Model, 'file'> = await modelFile.readJson();

          for (const extension of IMAGE_EXTENSIONS) {
            if (
              await exists(
                this.metaPath(dir.name, ...file.parts, `${base}.${extension}`),
              )
            ) {
              data.image = `${base}.${extension}`;
              break;
            }
          }

          models[dir.name].push({
            ...data,
            file,
          });
        }
      }
    }

    return models;
  }

  async update(
    type: string,
    name: string,
    data: Partial<Omit<Model, 'name' | 'size'>>,
  ) {
    const modelFile = this.modelFile(type, name);
    await modelFile.writeJson({
      ...(await modelFile.readJson()),
      ...data,
    });
  }

  async delete(type: string, name: string) {
    await tryUnlink(this.path(type, name));
    for (const extension of IMAGE_EXTENSIONS) {
      await tryUnlink(`${this.path(type, name)}.${extension}`);
    }
    await tryUnlink(`${this.path(type, name)}.json`);
  }

  async type(type: string) {
    const files = await walk(path.join(this.modelsDir, type), '');
    return files.filter(file => isModel(file.name));
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

  path(type: string, ...parts: string[]) {
    const modelsDir = this.modelsDir;
    return path.join(modelsDir, type, ...parts);
  }

  metaPath(type: string, ...parts: string[]) {
    const modelsDir = this.modelsDir;
    const last = parts.pop()!;
    return path.join(modelsDir, type, ...parts, '.metastable', last);
  }
}

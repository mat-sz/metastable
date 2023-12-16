import path from 'path';
import fs from 'fs/promises';
import { FileInfo, Project } from '@metastable/types';

export function select(object: any, fields: Record<string, boolean>): any {
  const temp: any = {};
  for (const key of Object.keys(fields)) {
    if (fields[key] && typeof object[key] !== 'undefined') {
      temp[key] = object[key];
    }
  }
  return temp;
}

export function isPathIn(parent: string, filePath: string) {
  const rel = path.relative(parent, filePath);
  return (
    typeof rel === 'string' && !rel.startsWith('..') && !path.isAbsolute(rel)
  );
}

export async function exists(path: string) {
  try {
    return !!(await fs.lstat(path));
  } catch {
    return false;
  }
}

export async function tryMkdir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
}

export async function filenames(dirPath: string) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];

export class FileSystem {
  constructor(private dataDir: string) {}

  get modelsDir() {
    return path.join(this.dataDir, 'models');
  }

  get projectsDir() {
    return path.join(this.dataDir, 'projects');
  }

  async allModels() {
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

  async models(type: string) {
    return await walk(path.join(this.modelsDir, type), '', MODEL_EXTENSIONS);
  }

  async findModel(list: FileInfo[], startsWith: string) {
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

  modelsTypeDir(type: string) {
    return path.join(this.modelsDir, type);
  }

  modelPath(type: string, name: string) {
    const modelsDir = this.modelsDir;
    const result = path.join(modelsDir, type, name);
    if (!isPathIn(modelsDir, result)) {
      return undefined;
    }
    return result;
  }

  projectPath(id: Project['id'], type: 'output' | 'input') {
    return path.join(this.projectsDir, `${id}`, type);
  }

  async createProjectTree(id: Project['id']) {
    await tryMkdir(this.projectPath(id, 'output'));
    await tryMkdir(this.projectPath(id, 'input'));
  }
}

async function walk(
  currentPath: string,
  relative: string,
  extensions?: string[],
) {
  const files = await fs.readdir(currentPath, {
    withFileTypes: true,
  });

  const output: FileInfo[] = [];
  for (const file of files) {
    if (file.isFile()) {
      if (file.name.startsWith('.')) {
        continue;
      }

      const split = file.name.split('.');
      const ext = split[split.length - 1];
      if (extensions && !extensions.includes(ext)) {
        continue;
      }

      output.push({
        name: path.join(relative, file.name),
        size: (await fs.stat(path.join(currentPath, file.name))).size,
      });
    } else if (file.isDirectory()) {
      output.push(
        ...(await walk(
          path.join(currentPath, file.name),
          path.join(relative, file.name),
        )),
      );
    }
  }

  return output;
}

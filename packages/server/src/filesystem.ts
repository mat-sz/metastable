import path from 'path';
import fs from 'fs/promises';
import { FileInfo } from '@metastable/types';
import { isPathIn } from '@metastable/fs-helpers';

import { dataRoot } from './config.js';

export const modelsPath = path.join(dataRoot, 'models');
export const projectsPath = path.join(dataRoot, 'projects');

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];

export async function tryMkdir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
}

export async function createProjectTree(id: number) {
  await tryMkdir(getProjectDataPath(id, 'output'));
  await tryMkdir(getProjectDataPath(id, 'input'));
}

export function getModelsDir(type: string) {
  return path.join(modelsPath, type);
}

export function getModelPath(type: string, name: string) {
  const result = path.join(modelsPath, type, name);
  if (!isPathIn(modelsPath, result)) {
    return undefined;
  }
  return result;
}

export function getProjectDataPath(id: number, type: 'output' | 'input') {
  return path.join(projectsPath, `${id}`, type);
}

async function walk(currentPath: string, relative: string) {
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
      if (!MODEL_EXTENSIONS.includes(ext)) {
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

export async function getModels() {
  const subdirs = await fs.readdir(modelsPath, {
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

    models[dir.name] = await getModelsByType(dir.name);
  }

  return models;
}

export async function getModelsByType(type: string) {
  return await walk(path.join(modelsPath, type), '');
}

export async function findModelByType(list: FileInfo[], startsWith: string) {
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

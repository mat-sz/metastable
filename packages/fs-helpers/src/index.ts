import path from 'path';
import fs from 'fs/promises';
import { FileInfo } from '@metastable/types';

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

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];

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

export async function getFileList(dirPath: string) {
  const subdirs = await fs.readdir(dirPath, {
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

    models[dir.name] = await walk(path.join(dirPath, dir.name), '');
  }

  return models;
}

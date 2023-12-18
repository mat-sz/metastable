import path from 'path';
import fs from 'fs/promises';
import { FileInfo, Project } from '@metastable/types';

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

export async function filenames(dirPath: string) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

export async function walk(
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

const FILENAME_REPLACE = /[<>:"/\\|?*\u0000-\u001F]/g;
const FILENAME_NEEDS_PREFIX = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

export async function freeDirName(parent: string, name: string) {
  let dirName = name.replace(FILENAME_REPLACE, '_');
  if (dirName.match(FILENAME_NEEDS_PREFIX)) {
    dirName = `_${dirName}`;
  }

  let current = dirName;
  let counter = 1;
  while (true) {
    if (!(await exists(path.join(parent, current)))) {
      break;
    }

    counter++;
    current = `${dirName} (${counter})`;
  }

  return current;
}

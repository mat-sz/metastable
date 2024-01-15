import path from 'path';
import fs from 'fs/promises';
import { FileInfo } from '@metastable/types';

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

export async function tryUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    //
  }
}

export async function walk(currentPath: string, relative: string) {
  const files = await fs.readdir(currentPath, {
    withFileTypes: true,
  });

  const output: FileInfo[] = [];
  for (const file of files) {
    if (file.isFile()) {
      if (file.name.startsWith('.')) {
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

export function resolveConfigPath(
  value: string | undefined,
  basePath: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

  return path.resolve(basePath, value);
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

export class TextFile {
  constructor(protected path: string) {}

  async read(): Promise<string | undefined> {
    try {
      return await fs.readFile(this.path, { encoding: 'utf-8' });
    } catch {
      return undefined;
    }
  }

  async write(data: string) {
    await fs.writeFile(this.path, data);
  }
}

export class JSONFile<T> extends TextFile {
  constructor(
    path: string,
    private fallback: T,
  ) {
    super(path);
  }

  async readJson(): Promise<T> {
    const data = await this.read();
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        //
      }
    }

    return this.fallback;
  }

  async writeJson(data: T) {
    await this.write(JSON.stringify(data));
  }
}

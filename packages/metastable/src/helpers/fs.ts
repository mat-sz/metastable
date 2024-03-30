import { Dirent } from 'fs';
import fs, { mkdir, unlink } from 'fs/promises';
import path from 'path';

export const IMAGE_EXTENSIONS = [
  'png',
  'jpeg',
  'jpg',
  'gif',
  'webp',
  'heif',
  'avif',
];

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

export async function ls(dirPath: string) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

export async function filenames(dirPath: string) {
  try {
    return (await fs.readdir(dirPath, { withFileTypes: true }))
      .filter(file => file.isFile())
      .map(file => file.name);
  } catch {
    return [];
  }
}

export async function imageFilenames(dirPath: string) {
  return (await filenames(dirPath)).filter(name => {
    if (name.includes('thumb')) {
      return false;
    }

    const split = name.split('.');
    return IMAGE_EXTENSIONS.includes(split[split.length - 1]);
  });
}

export async function walk(currentPath: string) {
  const files = await fs.readdir(currentPath, {
    withFileTypes: true,
  });

  const output: Dirent[] = [];
  for (const file of files) {
    if (file.isFile()) {
      if (file.name.startsWith('.')) {
        continue;
      }

      output.push(file);
    } else if (file.isDirectory()) {
      output.push(...(await walk(path.join(file.path, file.name))));
    }
  }

  return output;
}

export async function fileSize(filePath: string) {
  const stat = await fs.lstat(filePath);
  return stat.size;
}

export async function directorySize(currentPath: string) {
  const files = await fs.readdir(currentPath, {
    withFileTypes: true,
  });

  const promises: Promise<number>[] = [];
  for (const file of files) {
    const filePath = path.join(currentPath, file.name);
    if (file.isFile()) {
      if (file.name.startsWith('.')) {
        continue;
      }

      promises.push(fileSize(filePath));
    } else if (file.isDirectory()) {
      promises.push(directorySize(filePath));
    }
  }

  return (await Promise.all(promises)).reduce(
    (prev, current) => prev + current,
    0,
  );
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

export function removeFileExtension(string: string): string {
  const split = string.split('.');
  split.pop();
  return split.join('.');
}

export async function tryMkdir(path: string): Promise<boolean> {
  try {
    await mkdir(path, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export async function tryUnlink(filePath?: string): Promise<boolean> {
  if (!filePath) {
    return false;
  }

  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

const METADATA_DIRECTORY_NAME = '.metastable';

export function getMetadataDirectory(filePath: string) {
  const dirName = path.dirname(filePath);
  if (dirName.includes(METADATA_DIRECTORY_NAME)) {
    return dirName;
  }

  return path.join(dirName, METADATA_DIRECTORY_NAME);
}

// eslint-disable-next-line no-control-regex
const FILENAME_REPLACE = /[<>:"/\\|?*\u0000-\u001F]/g;
const FILENAME_NEEDS_PREFIX = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

export async function getAvailableName(
  parent: string,
  name: string,
  isDirectory = false,
) {
  name = name.replace(FILENAME_REPLACE, '_');
  if (name.match(FILENAME_NEEDS_PREFIX)) {
    name = `_${name}`;
  }

  const items = await ls(parent);
  const split = name.split('.');
  const extension = !isDirectory && split.length > 1 ? `.${split.pop()!}` : '';
  const nameWithoutExtension = split.join('.');

  let counter = 1;

  while (items.includes(name)) {
    counter++;
    name = `${nameWithoutExtension} (${counter})${extension}`;
  }

  return name;
}

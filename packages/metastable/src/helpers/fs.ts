import { Dirent } from 'fs';
import fs, { mkdir, unlink } from 'fs/promises';
import path from 'path';

import { DirentType } from '@metastable/types';

export const IMAGE_EXTENSIONS = [
  'png',
  'jpeg',
  'jpg',
  'gif',
  'webp',
  'heif',
  'avif',
];

export const CONFIG_EXTENSIONS = ['yaml'];

export async function testExtensions(
  dirPath: string,
  name: string,
  extensions: string[],
): Promise<string | undefined> {
  for (const extension of extensions) {
    const filename = `${name}.${extension}`;
    if (await exists(path.join(dirPath, filename))) {
      return filename;
    }
  }

  return undefined;
}

export async function exists(path: string) {
  try {
    return !!(await fs.stat(path));
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

export async function dirnames(dirPath: string) {
  try {
    return (await fs.readdir(dirPath, { withFileTypes: true }))
      .filter(file => file.isDirectory())
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
  const dirents = await fs.readdir(currentPath, {
    withFileTypes: true,
    recursive: true,
  });
  return dirents.filter(entity => entity.isFile());
}

export async function fileSize(filePath: string) {
  const stat = await fs.lstat(filePath);
  return stat.size;
}

export async function directorySize(currentPath: string) {
  const files = await fs.readdir(currentPath, {
    withFileTypes: true,
    recursive: true,
  });

  const promises: Promise<number>[] = [];
  for (const file of files) {
    const filePath = path.join(file.parentPath, file.name);
    if (file.isFile()) {
      if (file.parentPath.includes(METADATA_DIRECTORY_NAME)) {
        continue;
      }

      promises.push(fileSize(filePath));
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

export const METADATA_DIRECTORY_NAME = '.metastable';

export function getMetadataDirectory(filePath: string) {
  const dirName = path.dirname(filePath);
  if (dirName.includes(METADATA_DIRECTORY_NAME)) {
    return dirName;
  }

  return path.join(dirName, METADATA_DIRECTORY_NAME);
}

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

export async function getNextNumber(dirPath: string) {
  const filenames = await fs.readdir(dirPath);
  const numbers = filenames
    .filter(name => name.includes('.'))
    .map(name => name.split('.')[0])
    .map(name => parseInt(name))
    .filter(number => !!number);
  return Math.max(...numbers, 0) + 1;
}

export async function getNextFilename(dir: string, ext: string) {
  const counter = await getNextNumber(dir);
  return `${counter.toLocaleString('en-US', {
    minimumIntegerDigits: 5,
    useGrouping: false,
  })}.${ext}`;
}

export async function rmdir(dir: string) {
  await fs.rm(dir, { force: true, recursive: true });
}

export function direntType(item: Dirent) {
  if (item.isFile()) {
    return DirentType.FILE;
  } else if (item.isDirectory()) {
    return DirentType.DIRECTORY;
  } else if (item.isSymbolicLink()) {
    return DirentType.SYMLINK;
  } else if (item.isBlockDevice()) {
    return DirentType.BLOCK_DEVICE;
  } else if (item.isCharacterDevice()) {
    return DirentType.CHARACTER_DEVICE;
  } else if (item.isFIFO()) {
    return DirentType.FIFO;
  } else if (item.isSocket()) {
    return DirentType.SOCKET;
  }

  return undefined;
}

import path from 'path';
import fs from 'fs/promises';
import which from 'which';

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

export async function hasCommand(name: string) {
  return !!(await which(name, { nothrow: true }));
}

export async function getPythonCommand() {
  if (await hasCommand('python3')) {
    return 'python3';
  } else {
    return 'python';
  }
}

import path from 'path';
import fs from 'fs/promises';

const MODEL_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth', 'safetensors'];

interface FileInfo {
  name: string;
  size: number;
}

export class FileSystem {
  async models() {
    const modelsDir = path.resolve('../models');
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

      models[dir.name] = await this.walk(path.join(modelsDir, dir.name), '');
    }

    return models;
  }

  private async walk(currentPath: string, relative: string) {
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
          ...(await this.walk(
            path.join(currentPath, file.name),
            path.join(relative, file.name),
          )),
        );
      }
    }

    return output;
  }
}

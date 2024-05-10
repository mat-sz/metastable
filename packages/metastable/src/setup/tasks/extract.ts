import fs from 'fs';
import { link, mkdir, symlink, writeFile } from 'fs/promises';
import path from 'path';

import { TaskState } from '@metastable/types';
import { rimraf } from 'rimraf';
import tarStream from 'tar-stream';

import { tryMkdir, tryUnlink } from '../../helpers/fs.js';
import { WrappedPromise } from '../../helpers/promise.js';
import { BaseTask } from '../../tasks/task.js';

export class ExtractTask extends BaseTask {
  constructor(
    private partPaths: string[],
    private targetPath: string,
  ) {
    super('extract', undefined);
  }

  async execute() {
    const { decompressStream } = await import('@metastable/cppzst');

    this.appendLog('Removing old data...');
    try {
      await rimraf(path.join(this.targetPath));
    } catch {}

    await tryMkdir(this.targetPath);

    const wrapped = new WrappedPromise<TaskState>();
    const parts = this.partPaths.sort();

    const extract = tarStream.extract();

    extract.on('entry', (header, stream, cb) => {
      const filePath = path.join(this.targetPath, header.name);

      switch (header.type) {
        case 'file':
          writeFile(filePath, stream, { mode: header.mode }).then(() => cb());
          break;
        case 'directory':
          mkdir(filePath).then(() => cb());
          break;
        case 'link':
          link(header.linkname!, filePath).then(() => cb());
          break;
        case 'symlink':
          symlink(header.linkname!, filePath).then(() => cb());
          break;
      }
    });
    extract.on('finish', () => {
      wrapped.resolve(TaskState.SUCCESS);
      this.appendLog('Done.');
    });

    const decompressor = decompressStream();
    decompressor.pipe(extract);

    const next = () => {
      const part = parts.shift();
      if (!part) {
        return;
      }

      const readStream = fs.createReadStream(part);
      readStream.pipe(decompressor, { end: !parts.length });
      readStream.on('end', () => {
        tryUnlink(part);
        next();
      });
    };

    this.appendLog(`Extracting to: ${this.targetPath}`);
    next();

    return await wrapped.promise;
  }
}

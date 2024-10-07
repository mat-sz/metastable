import fs from 'fs';
import { link, mkdir, stat, symlink, writeFile } from 'fs/promises';
import path from 'path';

import { TaskState } from '@metastable/types';
import { rimraf } from 'rimraf';
import tarStream from 'tar-stream';

import { tryMkdir, tryUnlink } from '../../helpers/fs.js';
import { WrappedPromise } from '../../helpers/promise.js';
import { BaseTask } from '../../tasks/task.js';

export class ExtractTask extends BaseTask {
  #offset = 0;
  #size = 0;

  constructor(
    private partPaths: string[],
    private targetPath: string,
  ) {
    super('extract', undefined);
  }

  private lastProgress = Date.now();
  private emitProgress() {
    if (Date.now() - this.lastProgress > 500) {
      this.lastProgress = Date.now();
      this.progress = Math.min(1, this.#offset / (this.#size || 1));
    }
  }

  async execute() {
    this.#size = 0;
    for (const part of this.partPaths) {
      this.#size += (await stat(part)).size;
    }

    const { createBrotliDecompress } = await import('zlib');

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

    const decompressor = createBrotliDecompress({
      chunkSize: 131072,
    });
    decompressor.pipe(extract);

    const next = () => {
      const part = parts.shift();
      if (!part) {
        return;
      }

      const readStream = fs.createReadStream(part);
      readStream.pipe(decompressor, { end: !parts.length });
      readStream.on('data', chunk => {
        this.#offset += chunk.length;
        this.emitProgress();
      });
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

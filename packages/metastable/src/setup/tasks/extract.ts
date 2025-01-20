import fs from 'fs';
import { link, mkdir, stat, symlink, writeFile } from 'fs/promises';
import path from 'path';

import { TaskState } from '@metastable/types';
import tarStream from 'tar-stream';

import { tryMkdir, tryUnlink } from '../../helpers/fs.js';
import { WrappedPromise } from '../../helpers/promise.js';
import { BaseTask } from '../../tasks/task.js';

interface ExtractTaskOptions {
  parts: string[];
  destination: string;
}

export class ExtractTask extends BaseTask {
  #offset = 0;
  #size = 0;

  constructor(
    name: string,
    private options: ExtractTaskOptions,
  ) {
    super(name, undefined);
  }

  private lastProgress = Date.now();
  private emitProgress() {
    if (Date.now() - this.lastProgress > 500) {
      this.lastProgress = Date.now();
      this.progress = Math.min(1, this.#offset / (this.#size || 1));
    }
  }

  async execute() {
    const { parts, destination } = this.options;
    await tryMkdir(destination);

    parts.sort();

    this.#size = 0;
    for (const part of parts) {
      this.#size += (await stat(part)).size;
    }

    const { decompressStream } = await import('@metastable/cppzst');

    const wrapped = new WrappedPromise<TaskState>();
    const extract = tarStream.extract();

    extract.on('entry', (header, stream, cb) => {
      const filePath = path.join(destination, header.name);

      switch (header.type) {
        case 'file':
          writeFile(filePath, stream, { mode: header.mode })
            .then(() => cb())
            .catch(e => wrapped.reject(e));
          break;
        case 'directory':
          mkdir(filePath, { recursive: true })
            .then(() => cb())
            .catch(e => wrapped.reject(e));
          break;
        case 'link':
          link(header.linkname!, filePath)
            .then(() => cb())
            .catch(e => wrapped.reject(e));
          break;
        case 'symlink':
          symlink(header.linkname!, filePath)
            .then(() => cb())
            .catch(e => wrapped.reject(e));
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
      readStream.on('data', chunk => {
        this.#offset += chunk.length;
        this.emitProgress();
      });
      readStream.on('end', () => {
        tryUnlink(part);
        next();
      });
    };

    this.appendLog(`Extracting to: ${destination}`);
    next();

    return await wrapped.promise;
  }
}

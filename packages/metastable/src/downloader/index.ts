import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import { TaskState } from '@metastable/types';

import { exists } from '../helpers.js';
import { BaseTask } from '../task/task.js';
import { PromiseWrapper } from '../python/spawn.js';

interface DownloadData {
  offset: number;
  size: number;
  name: string;
  url: string;
}

const USER_AGENT = 'Metastable/0.0.0';
const CHUNK_SIZE = 10 * 1024 * 1024;

export class BaseDownloadTask extends BaseTask<DownloadData> {
  private downloadUrl?: string;
  #offset = 0;

  constructor(
    type: string,
    public url: string,
    public savePath: string,
  ) {
    super(
      type,
      { offset: 0, size: 0, url, name: path.basename(savePath) },
      TaskState.PREPARING,
    );
    this.init();
  }

  async init() {
    const { data, headers, request } = await axios({
      url: this.url,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
      },
      responseType: 'stream',
    });

    data.destroy();
    const responseUrl = request?.res?.responseUrl;
    if (responseUrl?.includes('/login')) {
      throw new Error('Login required');
    }

    this.downloadUrl = responseUrl || this.url;

    const size = parseInt(headers['content-length']);
    this.prepared({ ...this.data, size });
  }

  private lastProgress = Date.now();
  private emitProgress() {
    if (Date.now() - this.lastProgress > 500) {
      this.lastProgress = Date.now();
      this.data = {
        ...this.data,
        offset: this.#offset,
      };
      this.progress = this.data.offset / this.data.size;
    }
  }

  async execute() {
    await this.waitForPrepared();

    const partPath = `${this.savePath}.part`;
    if (await exists(partPath)) {
      // TODO: Continue download?
      await fs.unlink(partPath);
    } else {
      await fs.mkdir(path.dirname(partPath), { recursive: true });
    }

    const wrapped = new PromiseWrapper<void>();
    const writer = createWriteStream(partPath);

    const onClose = async () => {
      writer.close();
      if (this.cancellationPending) {
        await fs.unlink(partPath);
        // TODO: Return cancelled?
        wrapped.resolve();
      } else {
        await fs.rename(partPath, this.savePath);
        wrapped.resolve();
      }
    };

    let start = 0;
    let end = CHUNK_SIZE;

    const nextChunk = async () => {
      if (end >= this.data.size) {
        end = 0;
      }

      const { data } = await axios({
        url: this.downloadUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': USER_AGENT,
          Range: `bytes=${start}-${end || ''}`,
        },
      });
      data.on('data', (chunk: any) => {
        if (this.cancellationPending) {
          data.destroy();
          return;
        }

        this.#offset = chunk.length + (this.#offset || 0);
        this.emitProgress();
      });
      data.on('end', async () => {
        if (this.cancellationPending) {
          data.close();
          return;
        }

        if (!end) {
          onClose();
        } else {
          data.removeAllListeners();
          start = end + 1;
          end += CHUNK_SIZE;
          nextChunk();
        }
      });
      data.on('close', () => {
        if (this.cancellationPending) {
          onClose();
        }
      });
      data.pipe(writer, { end: false });
    };

    nextChunk();

    return wrapped.promise;
  }
}

export async function download(
  url: string,
  savePath: string,
  onProgress?: (task: DownloadTask) => void,
): Promise<void> {
  const task = new DownloadTask(url, savePath);
  task.on('update', () => {
    onProgress?.(task);
  });
  await task.execute();
}

export class DownloadTask extends BaseDownloadTask {
  constructor(
    public url: string,
    public savePath: string,
  ) {
    super('download', url, savePath);
  }
}

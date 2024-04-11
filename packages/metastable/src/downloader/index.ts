import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { DownloadData, DownloadSettings, TaskState } from '@metastable/types';
import axios from 'axios';

import { ModelEntity } from '../data/model.js';
import { exists, tryMkdir } from '../helpers/fs.js';
import { WrappedPromise } from '../helpers/promise.js';
import { BaseTask } from '../tasks/task.js';

const USER_AGENT = 'Metastable/0.0.0';
const CHUNK_SIZE = 10 * 1024 * 1024;

export class BaseDownloadTask extends BaseTask<DownloadData> {
  private downloadUrl?: string;
  #offset = 0;

  constructor(
    type: string,
    public url: string,
    public savePath: string,
    public headers: Record<string, string> = {},
  ) {
    super(type, {
      offset: 0,
      size: 0,
      url,
      name: path.basename(savePath),
      speed: 0,
    });
    this.created();
  }

  async init() {
    const { data, headers, request } = await axios({
      url: this.url,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        ...this.headers,
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
    return { ...this.data, size };
  }

  private lastProgress = Date.now();
  private emitProgress() {
    if (Date.now() - this.lastProgress > 500) {
      this.lastProgress = Date.now();
      this.data = {
        ...this.data,
        offset: this.#offset,
        speed: this.startedAt
          ? this.#offset / ((new Date().getTime() - this.startedAt) / 1000)
          : 0,
      };
      this.progress = this.data.offset / this.data.size;
    }
  }

  async execute() {
    const partPath = `${this.savePath}.part`;
    if (await exists(partPath)) {
      // TODO: Continue download?
      await fs.unlink(partPath);
    } else {
      await fs.mkdir(path.dirname(partPath), { recursive: true });
    }

    const wrapped = new WrappedPromise<TaskState>();
    const writer = createWriteStream(partPath);

    const onClose = async () => {
      writer.close();
      if (this.cancellationPending) {
        await fs.unlink(partPath);
        wrapped.resolve(TaskState.CANCELLED);
      } else {
        this.data = {
          ...this.data,
          offset: this.data.size,
          speed: 0,
        };
        this.progress = 1;
        await fs.rename(partPath, this.savePath);
        wrapped.resolve(TaskState.SUCCESS);
      }
    };

    let start = 0;
    let end = CHUNK_SIZE;

    const nextChunk = async () => {
      if (end >= this.data.size) {
        end = 0;
      }

      try {
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
        data.on('end', () => {
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
      } catch (e) {
        wrapped.reject(e);
      }
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

export class DownloadModelTask extends BaseDownloadTask {
  constructor(
    public settings: DownloadSettings,
    public savePath: string,
    public headers: Record<string, string> = {},
  ) {
    super('download', settings.url, savePath, headers);
  }

  async execute() {
    const state = await super.execute();

    if (state === TaskState.SUCCESS) {
      const { imageUrl, info } = this.settings;

      const model = new ModelEntity(this.savePath);
      await tryMkdir(path.join(path.dirname(this.savePath), '.metastable'));

      if (imageUrl) {
        try {
          const { data, headers } = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': USER_AGENT,
            },
          });

          let ext: string | undefined = undefined;
          switch (headers['content-type']) {
            case 'image/jpeg':
              ext = 'jpg';
              break;
            case 'image/png':
              ext = 'png';
              break;
          }

          if (ext) {
            await model.writeImage(data, ext);
          }
        } catch {}
      }

      if (info) {
        try {
          await model.metadata.set(info);
        } catch {}
      }
    }

    return state;
  }
}

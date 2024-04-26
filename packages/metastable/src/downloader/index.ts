import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { DownloadData, DownloadSettings, TaskState } from '@metastable/types';
import axios from 'axios';

import { ModelEntity } from '../data/model.js';
import { exists, tryMkdir } from '../helpers/fs.js';
import { WrappedPromise } from '../helpers/promise.js';
import { SuperTask } from '../tasks/supertask.js';
import { BaseTask } from '../tasks/task.js';

const USER_AGENT = 'Metastable/0.0.0';

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
    this.appendLog(`Downloading: ${this.url}`);

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
    if (this.downloadUrl !== this.url) {
      this.appendLog(`Found redirect: ${this.downloadUrl}`);
    }

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

    const onClose = async (error?: any) => {
      writer.close();
      if (this.cancellationPending || error) {
        await fs.unlink(partPath);

        if (this.cancellationPending) {
          wrapped.resolve(TaskState.CANCELLED);
        } else {
          wrapped.reject(error);
        }
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

    writer.on('error', e => {
      onClose(e);
    });

    try {
      const { data } = await axios({
        url: this.downloadUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': USER_AGENT,
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

        onClose();
      });
      data.on('close', () => {
        if (this.cancellationPending) {
          onClose();
        }
      });
      data.on('error', (e: any) => {
        data.close();
        onClose(e);
      });
      data.pipe(writer, { end: false });
    } catch (e) {
      wrapped.reject(e);
    }

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

export interface DownloadTaskItem {
  url: string;
  savePath: string;
  headers?: Record<string, string>;
}

export class MultiDownloadTask extends SuperTask {
  constructor(
    name: string,
    private items: DownloadTaskItem[],
  ) {
    super(name, {});
    this.created();
  }

  async init() {
    this.queue.on('event', event => {
      switch (event.event) {
        case 'task.log':
          this.appendLog(event.data.log);
          break;
      }
    });

    for (const item of this.items) {
      this.queue.add(
        new BaseDownloadTask('download', item.url, item.savePath, item.headers),
      );
    }

    return {};
  }
}

import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { ReadableStream } from 'stream/web';

import { DownloadData, DownloadSettings, TaskState } from '@metastable/types';

import { ModelEntity } from '../data/model.js';
import { exists, tryMkdir, tryUnlink } from '../helpers/fs.js';
import { SuperTask } from '../tasks/supertask.js';
import { BaseTask } from '../tasks/task.js';

const USER_AGENT = 'Metastable/0.0.0';

export class BaseDownloadTask extends BaseTask<DownloadData> {
  private downloadUrl?: string;
  private controller = new AbortController();
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

  cancel() {
    this.state = TaskState.CANCELLING;
    this.controller.abort();
  }

  async init() {
    this.appendLog(`Downloading: ${this.url}`);

    const res = await fetch(this.url, {
      headers: {
        'User-Agent': USER_AGENT,
        ...this.headers,
      },
    });

    if (res.url?.includes('/login') || res.status === 401) {
      throw new Error('Unable to download file: Authorization required');
    }

    if (!res.ok) {
      throw new Error(`Non-OK status code: ${res.status} - ${res.statusText}`);
    }

    this.downloadUrl = res.url || this.url;
    if (this.downloadUrl !== this.url) {
      this.appendLog(`Found redirect: ${this.downloadUrl}`);
    }

    const contentLength = res.headers.get('content-length');
    if (!contentLength) {
      throw new Error(
        "Unable to download file: response lacks 'Content-Length' header",
      );
    }

    const size = parseInt(contentLength);
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

    const writer = createWriteStream(partPath);

    writer.on('error', e => {
      this.controller.abort(e);
    });

    try {
      const res = await fetch(this.downloadUrl!, {
        headers: {
          'User-Agent': USER_AGENT,
        },
        signal: this.controller.signal,
      });

      const reader = (res.body as ReadableStream<Uint8Array>)?.getReader();
      if (!reader) {
        throw new Error('Unable to create body reader.');
      }

      let done = false;
      let value;
      while (!done) {
        ({ value, done } = await reader!.read());

        if (value) {
          writer.write(value);
          this.#offset += value.byteLength;
          this.emitProgress();
        }
      }

      this.data = {
        ...this.data,
        offset: this.data.size,
        speed: 0,
      };
      this.progress = 1;

      writer.close();
      await fs.rename(partPath, this.savePath);
    } catch (e) {
      writer.close();
      await tryUnlink(partPath);

      if (e instanceof Error && e.name === 'AbortError') {
        return TaskState.CANCELLED;
      }

      throw e;
    }

    return TaskState.SUCCESS;
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
      const { imageUrl, metadata } = this.settings;

      const model = new ModelEntity(this.savePath);
      await tryMkdir(path.join(path.dirname(this.savePath), '.metastable'));

      if (imageUrl) {
        try {
          const res = await fetch(imageUrl, {
            headers: {
              'User-Agent': USER_AGENT,
            },
          });

          const data = await res.arrayBuffer();
          const type = res.headers.get('content-type');

          let ext: string | undefined = undefined;
          switch (type) {
            case 'image/jpeg':
              ext = 'jpg';
              break;
            case 'image/png':
              ext = 'png';
              break;
          }

          if (ext) {
            await model.writeImage(new Uint8Array(data), ext);
          }
        } catch {}
      }

      if (metadata) {
        try {
          await model.metadata.set(metadata);
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

export class MultiDownloadTask extends SuperTask<{
  speed: number;
  size: number;
  offset: number;
}> {
  constructor(
    name: string,
    private items: DownloadTaskItem[],
  ) {
    super(name, { speed: 0, size: 0, offset: 0 }, { forwardProgress: false });
    this.created();
  }

  async init() {
    this.queue.on('log', event => {
      this.appendLog(event.log);
    });

    this.queue.on('update', () => {
      const size = this.queue.tasks.reduce(
        (value, task) => value + (task.data.size || 0),
        0,
      );
      const offset = this.queue.tasks.reduce(
        (value, task) => value + (task.data.offset || 0),
        0,
      );
      const speed = this.queue.tasks.reduce(
        (value, task) => (task.data.speed > value ? task.data.speed : value),
        0,
      );
      this.progress = size === 0 ? 0 : offset / size;
      this.data = { speed, size, offset };
    });

    for (const item of this.items) {
      this.queue.add(
        new BaseDownloadTask('download', item.url, item.savePath, item.headers),
      );
    }

    return { speed: 0, size: 0, offset: 0 };
  }
}

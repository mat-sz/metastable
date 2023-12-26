import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import { nanoid } from 'nanoid';
import EventEmitter from 'events';
import { Download, DownloadState } from '@metastable/types';
import { exists } from '@metastable/fs-helpers';

const USER_AGENT = 'Metastable/0.0.0';
const CHUNK_SIZE = 10 * 1024 * 1024;

interface DownloadItem extends Download {
  cancelled?: boolean;
}

export class DownloadTask extends EventEmitter implements Download {
  id = nanoid();
  progress = 0;
  size = 0;
  startedAt?: number | undefined;
  cancelled?: boolean;
  state: DownloadState = 'queued';
  private downloadUrl?: string;
  name;

  constructor(
    public url: string,
    public savePath: string,
  ) {
    super();
    this.name = path.basename(savePath);
  }

  async prepare() {
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
    this.size = parseInt(headers['content-length']);
  }

  private lastProgress = Date.now();
  private emitProgress() {
    if (Date.now() - this.lastProgress > 500) {
      this.lastProgress = Date.now();
      this.emit('progress');
    }
  }

  async start() {
    const partPath = `${this.savePath}.part`;
    if (await exists(partPath)) {
      // TODO: Continue download?
      await fs.unlink(partPath);
    } else {
      await fs.mkdir(path.dirname(partPath), { recursive: true });
    }

    const writer = createWriteStream(partPath);
    const startedAt = Date.now();
    this.state = 'in_progress';
    this.startedAt = startedAt;
    this.emit('state');

    const onClose = async () => {
      writer.close();
      if (this.cancelled) {
        await fs.unlink(partPath);
        this.state = 'cancelled';
      } else {
        await fs.rename(partPath, this.savePath);
        this.state = 'done';
      }
      this.emit('state');
      this.emit('end');
    };

    let start = 0;
    let end = CHUNK_SIZE;

    const nextChunk = async () => {
      if (end >= this.size) {
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
        if (this.cancelled) {
          data.destroy();
          return;
        }

        this.progress = chunk.length + (this.progress || 0);
        this.emitProgress();
      });
      data.on('end', async () => {
        if (this.cancelled) {
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
        if (this.cancelled) {
          onClose();
        }
      });
      data.pipe(writer, { end: false });
    };

    nextChunk();
  }

  cancel() {
    this.state = 'cancelling';
    this.cancelled = true;
  }
}

export function download(
  url: string,
  savePath: string,
  onProgress?: (task: DownloadTask) => void,
): Promise<void> {
  return new Promise(resolve => {
    const task = new DownloadTask(url, savePath);
    task.prepare().then(() => task.start());
    task.on('progress', () => {
      onProgress?.(task);
    });
    task.on('end', () => {
      resolve();
    });
  });
}

export class Downloader extends EventEmitter {
  queue: DownloadTask[] = [];
  current: DownloadItem | undefined = undefined;

  constructor() {
    super();
  }

  async add(url: string, savePath: string) {
    const task = new DownloadTask(url, savePath);
    await task.prepare();

    task.on('progress', () => {
      this.emit('event', {
        event: 'download.progress',
        data: {
          id: task.id,
          progress: task.progress,
          startedAt: task.startedAt,
        },
      });
    });
    task.on('state', () => {
      this.emit('event', {
        event: 'download.state',
        data: {
          id: task.id,
          state: task.state,
          startedAt: task.startedAt,
        },
      });
    });
    task.on('end', () => {
      this.emitQueue();
      this.run();
    });

    this.queue.push(task);
    this.run();
    return { id: task.id, size: task.size, name: task.name };
  }

  async run() {
    const running = this.queue.find(item => item.state === 'in_progress');
    if (running) {
      return;
    }

    const current = this.queue.find(item => item.state === 'queued');
    current?.start();
    this.emitQueue();
  }

  cancel(id: string) {
    const item = this.queue.find(item => item.id === id);
    item?.cancel();
  }

  purge() {
    this.queue = this.queue.filter(
      item =>
        item.state !== 'queued' &&
        item.state !== 'in_progress' &&
        item.state !== 'cancelling',
    );
  }

  emitQueue() {
    this.emit('event', {
      event: 'download.queue',
      data: {
        queue_remaining: this.queue.filter(
          item => item.state === 'queued' || item.state === 'in_progress',
        ).length,
      },
    });
  }
}

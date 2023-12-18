import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import { nanoid } from 'nanoid';
import EventEmitter from 'events';
import { Download, DownloadState } from '@metastable/types';
import { exists, isPathIn } from '@metastable/fs-helpers';

const USER_AGENT = 'Metastable/0.0.0';
const CHUNK_SIZE = 10 * 1024 * 1024;

function getFilePaths(parent: string, type: string, name: string) {
  const filenameParts = name.split(/\\\//g);
  const filename = filenameParts.pop()!;
  const partFilename = `${filename}.part`;

  const typePath = path.join(parent, type);
  const dirPath = path.join(typePath, ...filenameParts);

  return { filename, partFilename, typePath, dirPath };
}

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

  constructor(
    public url: string,
    public type: string,
    public filename: string,
    private filePath: string,
    private partPath: string,
  ) {
    super();
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
    if (await exists(this.partPath)) {
      // TODO: Continue download?
      await fs.unlink(this.partPath);
    } else {
      await fs.mkdir(path.dirname(this.partPath), { recursive: true });
    }

    const writer = createWriteStream(this.partPath);
    const startedAt = Date.now();
    this.state = 'in_progress';
    this.startedAt = startedAt;
    this.emit('state');

    const onClose = async () => {
      writer.close();
      if (this.cancelled) {
        await fs.unlink(this.partPath);
        this.state = 'cancelled';
      } else {
        await fs.rename(this.partPath, this.filePath);
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
        onClose();
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

export class Downloader extends EventEmitter {
  queue: DownloadTask[] = [];
  current: DownloadItem | undefined = undefined;

  constructor(public parent: string) {
    super();
  }

  async add(type: string, url: string, name: string) {
    const { typePath, dirPath, partFilename, filename } = getFilePaths(
      this.parent,
      type,
      name,
    );
    if (!isPathIn(typePath, dirPath)) {
      throw new Error(
        'Attempted to save file outside of the parent directory.',
      );
    }

    const filePath = path.join(dirPath, filename);
    const partPath = path.join(dirPath, partFilename);
    const task = new DownloadTask(url, type, name, filePath, partPath);
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
    return { id: task.id, size: task.size };
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

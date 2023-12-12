import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import { nanoid } from 'nanoid';
import EventEmitter from 'events';

import { exists } from './helpers.js';
import { modelsPath } from './filesystem.js';

interface DownloadTask {
  id: string;
  type: string;
  url: string;
  filename: string;
  progress?: number;
  size?: number;
}

export class Downloader extends EventEmitter {
  queue: DownloadTask[] = [];
  current: DownloadTask | undefined = undefined;

  constructor() {
    super();
  }

  async add(type: string, url: string, filename: string) {
    const id = nanoid();
    const { data, headers, request } = await axios({
      url: url,
      method: 'GET',
      headers: {
        'User-Agent': 'Metastable/0.0.0',
      },
      responseType: 'stream',
    });

    data.destroy();
    const responseUrl = request?.res?.responseUrl;
    if (responseUrl?.includes('/login')) {
      return { error: 'Login required' };
    }

    const size = parseInt(headers['content-length']);

    this.queue.push({
      id,
      type,
      url,
      filename,
      size,
    });
    this.run();
    return { id, size };
  }

  async run() {
    if (this.current || this.queue.length === 0) {
      return;
    }

    this.current = this.queue.shift();
    const current = this.current;
    if (!current) {
      return;
    }

    const { data, headers } = await axios({
      url: current.url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Metastable/0.0.0',
      },
    });
    current.size = parseInt(headers['content-length']);

    const filename = current.filename;
    const partFilename = `${filename}.part`;

    const dirPath = path.join(modelsPath, current.type);

    const filePath = path.join(dirPath, filename);
    const partPath = path.join(dirPath, partFilename);

    if (await exists(partPath)) {
      // TODO: Continue download?
      await fs.unlink(partPath);
    }

    const writer = createWriteStream(partPath);
    const started_at = Date.now();
    this.emit('event', {
      event: 'download.start',
      data: {
        download_id: current.id,
      },
    });

    data.on('data', (chunk: any) => {
      current.progress = chunk.length + (current.progress || 0);
      this.emit('event', {
        event: 'download.progress',
        data: {
          download_id: current.id,
          size: current.size,
          progress: current.progress,
          started_at,
        },
      });
    });
    data.on('end', async () => {
      writer.close();
      await fs.rename(partPath, filePath);
      this.emit('event', {
        event: 'download.end',
        data: {
          download_id: current.id,
        },
      });
      this.current = undefined;
      this.run();
    });
    data.pipe(writer);
  }

  emitQueue() {
    this.emit('event', {
      event: 'download.queue',
      data: { queue_remaining: (this.current ? 1 : 0) + this.queue.length },
    });
  }
}

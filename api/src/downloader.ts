import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import { nanoid } from 'nanoid';
import EventEmitter from 'events';

import { exists } from './helpers.js';

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

  add(type: string, url: string, filename: string) {
    const id = nanoid();
    this.queue.push({
      id,
      type,
      url,
      filename,
    });
    this.run();
    return id;
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
    });
    const totalLength = headers['content-length'];
    current.size = parseInt(totalLength);

    const filename = current.filename;
    const partFilename = `${filename}.part`;

    const filePath = path.join(
      path.resolve('../models'),
      current.type,
      filename,
    );
    const partPath = path.join(
      path.resolve('../models'),
      current.type,
      partFilename,
    );

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

import { makeAutoObservable } from 'mobx';
import { ModelType } from '../types/model';
import { getUrl } from '../config';

interface Download {
  download_id: string;
  url: string;
  filename: string;
  type: ModelType;
  state: 'queued' | 'failed' | 'in_progress' | 'done' | 'cancelled';
  progress: number;
  size: number;
  started_at?: number;
}

export class DownloadStore {
  queue: Download[] = [];

  isOpen = false;

  remaining = 0;

  constructor() {
    makeAutoObservable(this);
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  async refresh() {
    // const res = await fetch(getUrl('/download/queue'));
    // const json = (await res.json()) as Pick<Download, 'download_id' | 'filename' | 'url' | 'type'>[];
  }

  updateDownload(download_id: string, update: Partial<Download>) {
    this.queue = this.queue.map(download =>
      download.download_id === download_id
        ? { ...download, ...update }
        : download,
    );
  }

  async cancel(download_id: string) {
    await fetch(getUrl('/download'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ download_id }),
    });
    this.updateDownload(download_id, { state: 'cancelled' });
  }

  async download(type: ModelType, url: string, filename: string) {
    const res = await fetch(getUrl('/download'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, url, filename }),
    });
    const json = (await res.json()) as { download_id: string };
    this.queue.push({
      download_id: json.download_id,
      type,
      url,
      filename,
      state: 'queued',
      progress: 0,
      size: 0,
    });
  }
}

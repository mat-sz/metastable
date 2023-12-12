import { makeAutoObservable, runInAction } from 'mobx';
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

  waiting = new Set<string>();
  errors: Record<string, string> = {};

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
    // const res = await fetch(getUrl('/downloads'));
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
    await fetch(getUrl(`/downloads/${download_id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ download_id }),
    });
    this.updateDownload(download_id, { state: 'cancelled' });
  }

  async download(type: ModelType, url: string, filename: string) {
    this.waiting.add(filename);

    const res = await fetch(getUrl('/downloads'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, url, filename }),
    });
    const json = (await res.json()) as
      | { id: string; size: number }
      | { error: string };
    runInAction(() => {
      this.waiting.delete(filename);

      if ('error' in json) {
        this.errors[filename] = json.error;
        return;
      }

      this.queue.push({
        download_id: json.id,
        size: json.size,
        type,
        url,
        filename,
        state: 'queued',
        progress: 0,
      });
    });
  }
}

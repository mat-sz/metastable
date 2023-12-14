import { makeAutoObservable, runInAction } from 'mobx';
import { ModelType } from '@metastable/types';

import { getUrl } from '../config';

interface Download {
  id: string;
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

  remaining = 0;

  waiting = new Set<string>();
  errors: Record<string, string> = {};

  constructor() {
    makeAutoObservable(this);
  }

  async refresh() {
    // const res = await fetch(getUrl('/downloads'));
    // const json = (await res.json()) as Pick<Download, 'id' | 'filename' | 'url' | 'type'>[];
  }

  updateDownload(id: string, update: Partial<Download>) {
    this.queue = this.queue.map(download =>
      download.id === id ? { ...download, ...update } : download,
    );
  }

  async cancel(id: string) {
    await fetch(getUrl(`/downloads/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    this.updateDownload(id, { state: 'cancelled' });
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
        id: json.id,
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

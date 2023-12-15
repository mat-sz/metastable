import { makeAutoObservable, runInAction } from 'mobx';
import { ModelType, Download } from '@metastable/types';

import { API } from '../api';

interface DownloadItem extends Download {
  state:
    | 'queued'
    | 'failed'
    | 'in_progress'
    | 'done'
    | 'cancelling'
    | 'cancelled';
}

export class DownloadStore {
  queue: DownloadItem[] = [];

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

  updateDownload(id: string, update: Partial<DownloadItem>) {
    this.queue = this.queue.map(download =>
      download.id === id ? { ...download, ...update } : download,
    );
  }

  async cancel(id: string) {
    await API.downloads.cancel(id);
  }

  async download(type: ModelType, url: string, filename: string) {
    this.waiting.add(filename);

    const json = await API.downloads.create({ type, url, filename });
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

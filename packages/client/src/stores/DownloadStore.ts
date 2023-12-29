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

  dismiss(id: string) {
    this.queue = this.queue.filter(download => download.id !== id);
  }

  async download(type: ModelType, url: string, name: string) {
    this.waiting.add(name);

    const json = await API.downloads.create({ type, url, name });
    runInAction(() => {
      this.waiting.delete(name);

      if ('error' in json) {
        this.errors[name] = json.error;
        return;
      }

      this.queue.push({
        id: json.id,
        size: json.size,
        url,
        name: json.name,
        state: 'queued',
        progress: 0,
      });
    });
  }
}

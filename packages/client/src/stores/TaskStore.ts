import { makeAutoObservable, runInAction } from 'mobx';
import { DownloadData, ModelType, Task, TaskEvent } from '@metastable/types';

import { API } from '../api';

export class TaskStore {
  queues: Record<string, Task<any>[]> = {
    downloads: [],
    setup: [],
  };

  waiting = new Set<string>();

  constructor() {
    makeAutoObservable(this);
    this.refresh();
  }

  async refresh() {
    const queues = await API.tasks.all();
    runInAction(() => {
      this.queues = queues;
    });
  }

  update(update: { id: string; queueId: string } & Partial<Task<any>>) {
    this.queues[update.queueId] = this.queues[update.queueId].map(item =>
      item.id === update.id ? { ...item, ...update } : item,
    );
    this.queues = { ...this.queues };
  }

  async cancel(queueId: string, taskId: string) {
    await API.tasks.cancel(queueId, taskId);
  }

  get downloads(): Task<DownloadData>[] {
    return this.queues.downloads || [];
  }

  dismiss(queueId: string, taskId: string) {
    this.queues[queueId] = this.queues[queueId].filter(
      task => task.id !== taskId,
    );
  }

  async download(type: ModelType, url: string, name: string) {
    this.waiting.add(name);

    try {
      await API.downloads.create({ type, url, name });
    } catch {
      // TODO: Handle json-less HTTP calls differently.
    }
    runInAction(() => {
      this.waiting.delete(name);
    });
  }

  onMessage(message: TaskEvent) {
    switch (message.event) {
      case 'task.create':
        this.queues[message.data.queueId].push(message.data);
        break;
      case 'task.log':
        {
          const item = this.queues[message.data.queueId].find(
            item => item.id === message.data.id,
          );
          if (item?.log) {
            const update = {
              ...message.data,
              log: (message.data.log.startsWith('\b')
                ? `${item.log.substring(0, item.log.lastIndexOf('\n'))}\n${
                    message.data.log
                  }`
                : `\n${message.data.log}`
              ).trim(),
            };
            this.update(update);
          }
        }
        break;
      case 'task.update':
        this.update(message.data);
        break;
    }
  }
}

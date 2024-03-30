import {
  DownloadData,
  DownloadSettings,
  Task,
  TaskEvent,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';

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
    const queues = await API.task.all.query();
    runInAction(() => {
      this.queues = queues as any;
    });
  }

  update(update: { id: string; queueId: string } & Partial<Task<any>>) {
    this.updateQueue(update.queueId, queue =>
      queue.map(item =>
        item.id === update.id ? { ...item, ...update } : item,
      ),
    );
  }

  async cancel(queueId: string, taskId: string) {
    await API.task.cancel.mutate({ queueId, taskId });
  }

  get downloads(): Task<DownloadData>[] {
    return this.queues.downloads || [];
  }

  async dismiss(queueId: string, taskId: string) {
    await API.task.dismiss.mutate({ queueId, taskId });
  }

  async download(settings: DownloadSettings) {
    this.waiting.add(settings.name);

    await API.download.create.mutate(settings);
    runInAction(() => {
      this.waiting.delete(settings.name);
    });
  }

  find(queueId: string, id: string) {
    return this.queues[queueId]?.find(item => item.id === id);
  }

  updateQueue(queueId: string, callback: (queue: Task<any>[]) => Task<any>[]) {
    const queue = this.queues[queueId] || [];
    this.queues[queueId] = callback(queue);
  }

  appendLog(queueId: string, taskId: string, log: string) {
    const item = this.find(queueId, taskId);
    if (item?.log) {
      const update = {
        id: taskId,
        queueId,
        log: (log.startsWith('\b')
          ? `${item.log.substring(0, item.log.lastIndexOf('\n'))}\n${log}`
          : `\n${log}`
        ).trim(),
      };
      this.update(update);
    }
  }

  onMessage({ event, data }: TaskEvent) {
    switch (event) {
      case 'task.create':
        this.updateQueue(data.queueId, queue => [...queue, data]);
        break;
      case 'task.log':
        this.appendLog(data.queueId, data.id, data.log);
        break;
      case 'task.update':
        this.update(data);
        break;
      case 'task.delete':
        this.updateQueue(data.queueId, queue =>
          queue.filter(item => item.id !== data.id),
        );
        break;
    }
  }
}

import {
  DownloadData,
  DownloadSettings,
  Task,
  TaskState,
  TaskUpdateEvent,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';
import { mainStore } from './MainStore';

export class TaskStore {
  queues: Record<string, Task<any>[]> = {
    downloads: [],
    setup: [],
    project: [],
    settings: [],
  };

  eventListeners: Record<string, Set<(...args: any) => void>> = {
    update: new Set(),
    delete: new Set(),
  };
  waiting = new Set<string>();

  constructor() {
    makeAutoObservable(this);

    API.task.onCreate.subscribe(undefined, {
      onData: event => {
        this.updateQueue(event.queueId, queue => [
          ...queue,
          event as Task<any>,
        ]);
      },
    });

    API.task.onUpdate.subscribe(undefined, {
      onData: event => {
        this.update(event);

        const task = this.find(event.queueId, event.id);
        if (task) {
          this.emit('update', task);
          this.dispatchNotification(event, task);
        }
      },
    });

    API.task.onDelete.subscribe(undefined, {
      onData: event => {
        const task = this.find(event.queueId, event.id);
        if (task) {
          this.emit('delete', task);
        }

        this.updateQueue(event.queueId, queue =>
          queue.filter(item => item.id !== event.id),
        );
      },
    });

    API.task.onLog.subscribe(undefined, {
      onData: event => {
        this.appendLog(event.queueId, event.id, event.log);
      },
    });
  }

  on(event: 'update' | 'delete', listener: (task: Task<any>) => void) {
    this.eventListeners[event].add(listener);
  }

  off(event: 'update' | 'delete', listener: (task: Task<any>) => void) {
    this.eventListeners[event].delete(listener);
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
    if (item) {
      const update = {
        id: taskId,
        queueId,
        log: `${item.log || ''}\n${log}`.trim(),
      };
      this.update(update);
    }
  }

  emit(event: 'update' | 'delete', data: Task<any>) {
    for (const listener of this.eventListeners[event]) {
      listener(data);
    }
  }

  dispatchNotification(event: TaskUpdateEvent, task: Task<any>) {
    if (event.queueId === 'project' && task.data?.projectId) {
      if (
        event.state === TaskState.SUCCESS ||
        event.state === TaskState.FAILED
      ) {
        mainStore.notify(
          `${task.data.projectId}`,
          `Generation ${
            event.state === TaskState.SUCCESS ? 'successful' : 'failed'
          }`,
          () => {
            mainStore.projects.select(task.data.projectId);
          },
        );
      }
    }
  }
}

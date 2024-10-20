import EventEmitter from 'events';

import { Task } from '@metastable/types';

import { BaseQueue, QueueTaskEvents } from './queue.js';
import { TypedEventEmitter } from '../types.js';

export * from './queue.js';
export * from './task.js';

const FORWARDED_EVENTS: (keyof QueueTaskEvents)[] = [
  'create',
  'update',
  'delete',
  'log',
];

export class Tasks extends (EventEmitter as {
  new (): TypedEventEmitter<QueueTaskEvents>;
}) {
  queues: Record<string, BaseQueue> = {
    downloads: new BaseQueue('downloads'),
    settings: new BaseQueue('settings', {
      dismissSuccessful: true,
      dismissCancelled: true,
    }),
    setup: new BaseQueue('setup', { stopOnFailure: true }),
    project: new BaseQueue('project', {
      dismissSuccessful: true,
      dismissCancelled: true,
    }),
  };

  constructor() {
    super();

    for (const value of Object.values(this.queues)) {
      for (const eventName of FORWARDED_EVENTS) {
        value.on(eventName, (event: any) => {
          this.emit(eventName, event);
        });
      }
    }
  }

  all(): Record<string, Task<any>[]> {
    const queues: Record<string, Task<any>[]> = {};
    for (const [key, value] of Object.entries(this.queues)) {
      queues[key] = value.toJSON().tasks;
    }
    return queues;
  }

  queue(queueId: string): Task<any>[] {
    return this.queues[queueId]?.tasks || [];
  }

  dismiss(queueId: string, taskId: string) {
    this.queues[queueId]?.dismiss(taskId);
  }

  cancel(queueId: string, taskId: string) {
    this.queues[queueId]?.cancel(taskId);
  }
}

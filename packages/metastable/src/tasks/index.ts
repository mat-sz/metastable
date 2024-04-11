import EventEmitter from 'events';

import { Task } from '@metastable/types';

import { BaseQueue } from './queue.js';

export * from './queue.js';
export * from './task.js';

export class Tasks extends EventEmitter {
  queues: Record<string, BaseQueue> = {
    downloads: new BaseQueue('downloads'),
    setup: new BaseQueue('setup'),
    project: new BaseQueue('project', { dismissSuccessful: true }),
  };

  constructor() {
    super();

    for (const value of Object.values(this.queues)) {
      value.on('event', event => this.emit('event', event));
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

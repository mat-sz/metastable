import { EventEmitter } from 'events';
import { Task, TaskQueue, TaskState } from '@metastable/types';

import { BaseTask } from './task.js';

export class BaseQueue<T = any> extends EventEmitter implements TaskQueue<T> {
  #tasks: BaseTask<T>[] = [];
  running = false;

  constructor(public readonly id: string) {
    super();
  }

  get tasks() {
    return this.#tasks.map(task => task.toJSON());
  }

  async add(task: BaseTask<T>) {
    this.#tasks.push(task);
    this.emit('event', {
      event: 'task.create',
      data: {
        queueId: this.id,
        ...task.toJSON(),
      },
    });

    task.on('update', (data: Partial<Task<T>>) => {
      this.emit('event', {
        event: 'task.update',
        data: {
          id: task.id,
          queueId: this.id,
          ...data,
        },
      });
    });
    task.on('log', (data: string) => {
      this.emit('event', {
        event: 'task.log',
        data: {
          id: task.id,
          queueId: this.id,
          log: data,
        },
      });
    });

    this.next();
  }

  async next() {
    if (this.running) {
      return;
    }

    const current = this.#tasks.find(
      item =>
        item.state === TaskState.QUEUED || item.state === TaskState.PREPARING,
    );
    if (current) {
      this.running = true;
      await current.waitForPrepared();
      current.started();
      try {
        await current.execute();
        current.stopped(TaskState.SUCCESS);
      } catch (e) {
        current.appendLog(String(e));
        current.stopped(TaskState.FAILED);
      }
      this.running = false;
      this.next();
    } else {
      this.running = false;
      this.emit('empty');
    }
  }

  cancel(id: string) {
    const item = this.#tasks.find(item => item.id === id);
    item?.cancel();
  }

  purge() {
    this.#tasks = this.#tasks.filter(
      item =>
        item.state !== TaskState.QUEUED &&
        item.state !== TaskState.RUNNING &&
        item.state !== TaskState.CANCELLING,
    );
  }

  toJSON(): TaskQueue<T> {
    return {
      id: this.id,
      tasks: this.tasks,
    };
  }
}

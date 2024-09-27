import { EventEmitter } from 'events';

import {
  Task,
  TaskCreateEvent,
  TaskDeleteEvent,
  TaskLogEvent,
  TaskQueue,
  TaskState,
  TaskUpdateEvent,
} from '@metastable/types';

import { BaseTask } from './task.js';
import { TypedEventEmitter } from '../types.js';

export type QueueTaskEvents = {
  create: (event: TaskCreateEvent) => void;
  update: (event: TaskUpdateEvent) => void;
  delete: (event: TaskDeleteEvent) => void;
  log: (event: TaskLogEvent) => void;
};

export type BaseQueueEvents = QueueTaskEvents & {
  empty: () => void;
  failed: () => void;
};

export interface BaseQueueSettings {
  startAutomatically?: boolean;
  dismissSuccessful?: boolean;
  dismissCancelled?: boolean;
  stopOnFailure?: boolean;
}

export class BaseQueue<T = any>
  extends (EventEmitter as {
    new (): TypedEventEmitter<BaseQueueEvents>;
  })
  implements TaskQueue<T>
{
  #tasks: BaseTask<T>[] = [];
  running = false;
  readonly settings: BaseQueueSettings;

  constructor(
    public readonly id: string,
    settings?: BaseQueueSettings,
  ) {
    super();

    this.settings = {
      stopOnFailure: false,
      dismissSuccessful: false,
      dismissCancelled: false,
      startAutomatically: true,
      ...settings,
    };
  }

  get tasks() {
    return this.#tasks.map(task => task.toJSON());
  }

  add(task: BaseTask<T>) {
    this.#tasks.push(task);
    this.emit('create', {
      queueId: this.id,
      ...task.toJSON(),
    });

    task.on('update', (data: Partial<Task<T>>) => {
      this.emit('update', {
        id: task.id,
        queueId: this.id,
        ...data,
      });
    });
    task.on('log', (data: string) => {
      this.emit('log', {
        id: task.id,
        queueId: this.id,
        log: data,
      });
    });

    if (this.settings.startAutomatically) {
      this.next();
    }
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

      let failed = false;
      try {
        await current.waitForPrepared();
        current.started();
        const state = await current.execute();
        current.stopped(state);

        if (state === TaskState.SUCCESS) {
          if (this.settings.dismissSuccessful) {
            this.dismiss(current.id);
          }
        } else {
          failed = true;
        }

        if (state === TaskState.CANCELLED && this.settings.dismissCancelled) {
          this.dismiss(current.id);
        }
      } catch (e: any) {
        failed = true;
        if (typeof e === 'object' && 'errors' in e) {
          for (const error of e.errors) {
            current.appendLog(`${String(error)}\n${error.stack}`);
          }
        } else {
          current.appendLog(String(e));
        }

        current.stopped(TaskState.FAILED);
      }

      if (failed && this.settings.stopOnFailure) {
        this.emit('failed');
        return;
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

  dismiss(id: string) {
    const item = this.#tasks.find(item => item.id === id);
    if (
      item &&
      item.state !== TaskState.RUNNING &&
      item.state !== TaskState.CANCELLING
    ) {
      this.#tasks = this.#tasks.filter(item => item.id !== id);
      this.emit('delete', {
        id: item.id,
        queueId: this.id,
      });
    }
  }

  purge() {
    for (const item of this.#tasks) {
      if (
        item.state !== TaskState.QUEUED &&
        item.state !== TaskState.RUNNING &&
        item.state !== TaskState.CANCELLING
      ) {
        this.dismiss(item.id);
      }
    }
  }

  toJSON(): TaskQueue<T> {
    return {
      id: this.id,
      tasks: this.tasks,
    };
  }
}

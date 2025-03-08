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

import { errorToString } from '#helpers/common.js';
import { BaseTask } from './task.js';

export type QueueTaskEvents = {
  create: [event: TaskCreateEvent];
  update: [event: TaskUpdateEvent];
  delete: [event: TaskDeleteEvent];
  log: [event: TaskLogEvent];
};

export type BaseQueueEvents = QueueTaskEvents & {
  empty: [];
  failed: [];
};

export interface BaseQueueSettings {
  startAutomatically?: boolean;
  dismissSuccessful?: boolean;
  dismissCancelled?: boolean;
  stopOnFailure?: boolean;
}

export class BaseQueue<T = any>
  extends EventEmitter<BaseQueueEvents>
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
      let failed = false;
      this.running = true;
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
        current.appendLog(errorToString(e));
        current.stopped(TaskState.FAILED);
      }
      this.running = false;

      if (failed && this.settings.stopOnFailure) {
        this.emit('failed');
      } else {
        this.next();
      }
    } else {
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

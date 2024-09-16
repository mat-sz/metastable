import { TaskState } from '@metastable/types';

import { BaseQueue } from './queue.js';
import { BaseTask } from './task.js';
import { WrappedPromise } from '../helpers/promise.js';

export class SuperTask<T = any> extends BaseTask<T> {
  constructor(
    name: string,
    data: T,
    private options: {
      forwardProgress?: boolean;
    } = { forwardProgress: true },
  ) {
    super(name, data);
  }
  protected queue = new BaseQueue(this.id, {
    stopOnFailure: true,
    startAutomatically: false,
  });

  execute() {
    const wrapped = new WrappedPromise<TaskState>();
    this.queue.on('empty', () => {
      wrapped.resolve(TaskState.SUCCESS);
    });
    this.queue.on('failed', () => {
      wrapped.resolve(TaskState.FAILED);
    });

    if (this.options.forwardProgress) {
      this.queue.on('update', event => {
        const count = this.queue.tasks.length;
        const completed = this.queue.tasks.filter(
          task => task.state === TaskState.SUCCESS,
        ).length;

        if (completed >= count) {
          this.progress = 1;
        } else {
          this.progress = (completed + (event.progress || 0)) / count;
        }
      });
    }

    this.queue.next();

    return wrapped.promise;
  }
}

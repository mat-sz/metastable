import { EventEmitter } from 'events';
import { nanoid } from 'nanoid/non-secure';
import { Task, TaskState } from '@metastable/types';

import { WrappedPromise } from '../helpers/promise.js';

export class BaseTask<T = any> extends EventEmitter implements Task<T> {
  id: string = nanoid();
  #startedAt: number | undefined = undefined;
  #finishedAt: number | undefined = undefined;
  log: string = '';
  #state: TaskState;
  #progress: number | undefined = undefined;
  #data: T;
  protected cancellationPending = false;

  init?(): Promise<T>;

  #preparedPromises: WrappedPromise<void>[] = [];

  constructor(
    public readonly type: string,
    data: T,
  ) {
    super();
    this.#data = data;
    this.#state = this.init ? TaskState.PREPARING : TaskState.QUEUED;
  }

  protected created() {
    this.init?.()
      .then(data => {
        this.prepared(data);
      })
      .catch(e => {
        this.failed(e);
      });
  }

  async waitForPrepared(): Promise<void> {
    if (this.#state === TaskState.PREPARING) {
      const promise = new WrappedPromise<void>();
      this.#preparedPromises.push(promise);
      return promise.promise;
    }

    return Promise.resolve();
  }

  async execute(): Promise<TaskState> {
    throw new Error('Not implemented');
  }

  protected failed(error: any = new Error('Failed.')) {
    this.#state = TaskState.FAILED;

    for (const promise of this.#preparedPromises) {
      promise.reject(error);
    }

    this.emit('update', {
      state: this.#state,
    });
  }

  protected prepared(data: T) {
    this.#state = TaskState.QUEUED;
    this.#data = data;

    for (const promise of this.#preparedPromises) {
      promise.resolve();
    }

    this.emit('update', {
      state: this.#state,
      data: this.#data,
    });
  }

  started() {
    this.#startedAt = Date.now();
    this.#progress = 0;
    this.#finishedAt = undefined;
    this.#state = TaskState.RUNNING;
    this.emit('update', {
      startedAt: this.#startedAt,
      progress: this.#progress,
      finishedAt: this.#finishedAt,
      state: this.#state,
    });
  }

  stopped(newState: TaskState = TaskState.SUCCESS) {
    this.#progress = newState === TaskState.SUCCESS ? 1 : 0;
    this.#finishedAt = Date.now();
    this.#state = newState;
    this.emit('update', {
      progress: this.#progress,
      finishedAt: this.#finishedAt,
      state: this.#state,
    });
  }

  cancel() {
    this.state = TaskState.CANCELLING;
    this.cancellationPending = true;
  }

  get data(): T {
    return this.#data;
  }

  set data(value: T) {
    this.#data = value;
    this.emit('update', { data: value });
  }

  get state(): TaskState {
    return this.#state;
  }

  set state(value: TaskState) {
    this.#state = value;
    this.emit('update', { state: value });
  }

  get progress(): number | undefined {
    return this.#progress;
  }

  set progress(value: number | undefined) {
    this.#progress = value;
    this.emit('update', { progress: value });
  }

  get startedAt(): number | undefined {
    return this.#startedAt;
  }

  get finishedAt(): number | undefined {
    return this.#finishedAt;
  }

  appendLog(data: string) {
    if (data.startsWith('\r')) {
      this.log = this.log.substring(0, this.log.lastIndexOf('\n'));
    }

    data = data.replace('\r\n', '\n');
    this.log += !this.log ? data : `\n${data}`;
    this.emit('log', data);
  }

  toJSON(): Task<T> {
    return {
      id: this.id,
      type: this.type,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      log: this.log,
      state: this.state,
      progress: this.progress,
      data: this.data,
    };
  }
}

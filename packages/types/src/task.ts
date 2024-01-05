export enum TaskState {
  PREPARING = 'preparing',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  RESTARTING = 'restarting',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLING = 'cancelling',
  CANCELLED = 'cancelled',
  UP_FOR_RETRY = 'up_for_retry',
}

export interface Task<T = any> {
  readonly id: string;
  readonly type: string;
  data: T;
  readonly log?: string;
  state: TaskState;

  /**
   * JS millisecond timestamp.
   */
  readonly startedAt?: number;

  /**
   * JS millisecond timestamp.
   */
  readonly finishedAt?: number;

  /**
   * Value range: 0 - 1
   */
  progress?: number;
}

export interface TaskQueue<T = any> {
  readonly id: string;
  tasks: Task<T>[];
}

export interface TaskCreateEvent<T = any> {
  event: 'task.create';
  data: {
    id: string;
    queueId: string;
  } & Task<T>;
}

export interface TaskUpdateEvent<T = any> {
  event: 'task.update';
  data: {
    id: string;
    queueId: string;
  } & Partial<Task<T>>;
}

export interface TaskDeleteEvent {
  event: 'task.delete';
  data: {
    id: string;
    queueId: string;
  };
}

export interface TaskLogEvent {
  event: 'task.log';
  data: {
    id: string;
    queueId: string;
    log: string;
  };
}

export type TaskEvent =
  | TaskCreateEvent
  | TaskUpdateEvent
  | TaskDeleteEvent
  | TaskLogEvent;

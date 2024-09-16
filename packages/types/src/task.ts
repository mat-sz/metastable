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

export interface TaskCreateEvent<T = any> extends Task<T> {
  id: string;
  queueId: string;
}

export interface TaskUpdateEvent<T = any> extends Partial<Task<T>> {
  id: string;
  queueId: string;
}

export interface TaskDeleteEvent {
  id: string;
  queueId: string;
}

export interface TaskLogEvent {
  id: string;
  queueId: string;
  log: string;
}

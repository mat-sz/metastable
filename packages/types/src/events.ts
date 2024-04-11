import { ComfyStatus } from './comfy.js';
import { SetupEvent } from './setup.js';
import { TaskEvent } from './task.js';
import { TrainingEvent } from './training.js';

export interface BackendStatusEvent {
  event: 'backend.status';
  data: ComfyStatus;
}

export type AnyEvent =
  | BackendStatusEvent
  | TaskEvent
  | SetupEvent
  | TrainingEvent;

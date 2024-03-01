import { ComfyEvent, ComfyStatus } from './comfy.js';
import { SetupEvent } from './setup.js';
import { TaskEvent } from './task.js';
import { TrainingEvent } from './training.js';

export interface ModelsChangedEvent {
  event: 'models.changed';
}

export interface BackendStatusEvent {
  event: 'backend.status';
  data: ComfyStatus;
}

export type AnyEvent =
  | ComfyEvent
  | ModelsChangedEvent
  | BackendStatusEvent
  | TaskEvent
  | SetupEvent
  | TrainingEvent;

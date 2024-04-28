import { SetupEvent } from './setup.js';
import { TaskEvent } from './task.js';
import { TrainingEvent } from './training.js';

export type AnyEvent = TaskEvent | SetupEvent | TrainingEvent;

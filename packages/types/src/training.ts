import { Project } from './project.js';

export interface TrainingStartEvent {
  event: 'training.start';
  data: {
    projectId: Project['id'];
  };
}

export interface TrainingEndEvent {
  event: 'training.end';
  data: {
    projectId: Project['id'];
  };
}

export interface TrainingLogEvent {
  event: 'training.log';
  data: {
    type: string;
    timestamp: number;
    text: string;
    projectId: Project['id'];
  };
}

export type TrainingEvent =
  | TrainingStartEvent
  | TrainingLogEvent
  | TrainingEndEvent;

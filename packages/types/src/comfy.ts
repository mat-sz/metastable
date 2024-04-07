import { ImageFile } from './file.js';
import { Project } from './project.js';

export interface ComfyTorchInfo {
  memory: {
    vram: number;
    ram: number;
  };
  device: {
    type: string;
    name: string;
    index?: number;
    allocator_backend?: string;
  };
  vae: {
    dtype: string;
  };
}

export type ComfyStatus = 'ready' | 'starting' | 'error';

export interface PromptStartEvent {
  event: 'prompt.start';
  data: {
    id: string;
    project_id: string;
  };
}

export interface PromptQueueEvent {
  event: 'prompt.queue';
  data: {
    queue_remaining: number;
  };
}

export interface PromptProgressEvent {
  event: 'prompt.progress';
  data: {
    id: string;
    project_id: string;
    max: number;
    value: number;
    preview?: string;
  };
}

export interface PromptErrorEvent {
  event: 'prompt.error';
  data: {
    id: string;
    project_id: string;
    name: string;
    description: string;
  };
}

export interface PromptEndEvent {
  event: 'prompt.end';
  data: {
    id: string;
    outputs: ImageFile[];
    output_filenames: string[];
    project_id: Project['id'];
  };
}

export type ComfyEvent =
  | PromptStartEvent
  | PromptQueueEvent
  | PromptErrorEvent
  | PromptProgressEvent
  | PromptEndEvent;

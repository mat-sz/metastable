import { FileInfo } from './file.js';

export interface Requirement {
  name: string;
  expected: string;
  actual: string;
  satisfied: boolean;
  type: string;
}

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

export interface ComfyLogItem {
  timestamp: number;
  type: string;
  text: string;
}

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
    max: number;
    value: number;
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
    output_filenames: string[];
    project_id: number;
  };
}

export interface TorchInfoEvent {
  event: 'info.torch';
  data: ComfyTorchInfo;
}

export type ComfyEvent =
  | PromptStartEvent
  | PromptQueueEvent
  | PromptErrorEvent
  | PromptProgressEvent
  | PromptEndEvent
  | TorchInfoEvent;

export interface InstanceInfo {
  samplers: string[];
  schedulers: string[];
  models: Record<string, FileInfo[]>;
}

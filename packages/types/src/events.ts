import { ComfyEvent, ComfyLogItem, ComfyStatus } from './comfy.js';

export interface DownloadStartEvent {
  event: 'download.start';
  data: {
    id: string;
  };
}

export interface DownloadQueueEvent {
  event: 'download.queue';
  data: {
    queue_remaining: number;
  };
}

export interface DownloadProgressEvent {
  event: 'download.progress';
  data: {
    id: string;
    size: number;
    progress: number;
    started_at: number;
  };
}

export interface DownloadEndEvent {
  event: 'download.end';
  data: {
    id: string;
  };
}

export interface ModelsChangedEvent {
  event: 'models.changed';
  data: Record<string, never>;
}

export interface BackendStatusEvent {
  event: 'backend.status';
  data: ComfyStatus;
}

export interface BackendLogEvent {
  event: 'backend.log';
  data: ComfyLogItem;
}

export interface BackendLogBufferEvent {
  event: 'backend.logBuffer';
  data: ComfyLogItem[];
}

export interface PingEvent {
  event: 'ping';
  data: number;
}

export type AnyEvent =
  | ComfyEvent
  | DownloadQueueEvent
  | DownloadProgressEvent
  | DownloadStartEvent
  | DownloadEndEvent
  | ModelsChangedEvent
  | BackendStatusEvent
  | BackendLogEvent
  | BackendLogBufferEvent
  | PingEvent;

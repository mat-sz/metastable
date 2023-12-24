import { ComfyEvent, ComfyLogItem, ComfyStatus } from './comfy.js';
import { DownloadEvent } from './download.js';

export interface ModelsChangedEvent {
  event: 'models.changed';
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
  | DownloadEvent
  | ModelsChangedEvent
  | BackendStatusEvent
  | BackendLogEvent
  | BackendLogBufferEvent
  | PingEvent;

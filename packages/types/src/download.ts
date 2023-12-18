export type DownloadState =
  | 'queued'
  | 'failed'
  | 'in_progress'
  | 'done'
  | 'cancelling'
  | 'cancelled';

export interface Download {
  id: string;
  url: string;
  name: string;
  progress: number;
  size: number;
  startedAt?: number;
  state: DownloadState;
}

export interface DownloadStateEvent {
  event: 'download.state';
  data: {
    id: string;
    state: DownloadState;
    startedAt: number;
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
    progress: number;
    startedAt: number;
  };
}

export type DownloadEvent =
  | DownloadStateEvent
  | DownloadQueueEvent
  | DownloadProgressEvent;

export interface PromptStartMessageModel {
  event: 'prompt.start';
  data: {
    id: string;
    project_id: string;
  };
}

export interface PromptQueueMessageModel {
  event: 'prompt.queue';
  data: {
    queue_remaining: number;
  };
}

export interface PromptProgressMessageModel {
  event: 'prompt.progress';
  data: {
    max: number;
    value: number;
  };
}

export interface PromptErrorMessageModel {
  event: 'prompt.error';
  data: {
    id: string;
    project_id: string;
    name: string;
    description: string;
  };
}

export interface PromptEndMessageModel {
  event: 'prompt.end';
  data: {
    id: string;
    output_filenames: string[];
    project_id: number;
  };
}

export interface DownloadStartMessageModel {
  event: 'download.start';
  data: {
    id: string;
  };
}

export interface DownloadQueueMessageModel {
  event: 'download.queue';
  data: {
    queue_remaining: number;
  };
}

export interface DownloadProgressMessageModel {
  event: 'download.progress';
  data: {
    id: string;
    size: number;
    progress: number;
    started_at: number;
  };
}

export interface DownloadEndMessageModel {
  event: 'download.end';
  data: {
    id: string;
  };
}

export interface ModelsChangedMessageModel {
  event: 'models.changed';
  data: Record<string, never>;
}

export type BackendStatus = 'ready' | 'starting' | 'error';
export interface BackendStatusMessageModel {
  event: 'backend.status';
  data: BackendStatus;
}

export interface BackendLogItem {
  timestamp: number;
  type: string;
  text: string;
}

export interface BackendLogMessageModel {
  event: 'backend.log';
  data: BackendLogItem;
}

export interface BackendLogBufferMessageModel {
  event: 'backend.logBuffer';
  data: BackendLogItem[];
}

export interface PingMessageModel {
  event: 'ping';
  data: number;
}

export type Message =
  | PromptStartMessageModel
  | PromptQueueMessageModel
  | PromptErrorMessageModel
  | PromptProgressMessageModel
  | PromptEndMessageModel
  | DownloadQueueMessageModel
  | DownloadProgressMessageModel
  | DownloadStartMessageModel
  | DownloadEndMessageModel
  | ModelsChangedMessageModel
  | BackendStatusMessageModel
  | BackendLogMessageModel
  | BackendLogBufferMessageModel
  | PingMessageModel;

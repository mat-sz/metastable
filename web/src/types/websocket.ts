export interface PromptStartMessageModel {
  event: 'prompt.start';
  data: {
    project_id: string;
    prompt_id: string;
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
    project_id: string;
    prompt_id: string;
    name: string;
    description: string;
  };
}

export interface PromptEndMessageModel {
  event: 'prompt.end';
  data: {
    prompt_id: string;
    output_filenames: string[];
    project_id: number;
  };
}

export interface DownloadStartMessageModel {
  event: 'download.start';
  data: {
    download_id: string;
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
    download_id: string;
    size: number;
    progress: number;
    started_at: number;
  };
}

export interface DownloadEndMessageModel {
  event: 'download.end';
  data: {
    download_id: string;
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

export interface BackendLogMessageModel {
  event: 'backend.log';
  data: {
    timestamp: number;
    type: string;
    text: string;
  };
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
  | BackendLogMessageModel;

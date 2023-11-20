export interface PromptQueueMessageModel {
  type: 'prompt.queue';
  data: {
    queue_remaining: number;
    sid?: string;
  };
}

export interface PromptProgressMessageModel {
  type: 'prompt.progress';
  data: {
    max: number;
    value: number;
  };
}

export interface PromptEndMessageModel {
  type: 'prompt.end';
  data: {
    prompt_id: string;
    output_filenames: string[];
    project_id: number;
  };
}

export interface DownloadStartMessageModel {
  type: 'download.start';
  data: {
    download_id: string;
  };
}

export interface DownloadQueueMessageModel {
  type: 'download.queue';
  data: {
    queue_remaining: number;
    sid?: string;
  };
}

export interface DownloadProgressMessageModel {
  type: 'download.progress';
  data: {
    download_id: string;
    size: number;
    progress: number;
    started_at: number;
  };
}

export interface DownloadEndMessageModel {
  type: 'download.end';
  data: {
    download_id: string;
  };
}

export interface ModelsChangedMessageModel {
  type: 'models.changed';
  data: Record<string, never>;
}

export type Message =
  | PromptQueueMessageModel
  | PromptProgressMessageModel
  | PromptEndMessageModel
  | DownloadQueueMessageModel
  | DownloadProgressMessageModel
  | DownloadStartMessageModel
  | DownloadEndMessageModel
  | ModelsChangedMessageModel;

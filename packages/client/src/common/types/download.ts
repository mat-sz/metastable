import { DownloadSettings } from '@metastable/types';

export enum DownloadFileState {
  DOWNLOADED,
  QUEUED,
  FAILED,
  NOT_QUEUED,
}

export interface DownloadFileInfo {
  settings: DownloadSettings;
  state: DownloadFileState;
  size?: number;
  offset?: number;
  error?: string;
}

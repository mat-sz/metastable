import { ModelType } from '@metastable/types';

export interface DownloadFile {
  name: string;
  type: ModelType;
  url: string;
  size?: number;
}

export interface DownloadableModel {
  name: string;
  source?: string;
  sourceId?: string;
  type: ModelType;
  downloads: DownloadFile[];
  recommended?: boolean;
  description?: string;
  homepage?: string;
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
  type: ModelType;
  recommended?: boolean;
  description?: string;
}

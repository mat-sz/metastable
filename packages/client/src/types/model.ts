import { DownloadSettings, ModelType } from '@metastable/types';

export interface DownloadableModel {
  name: string;
  source?: string;
  sourceId?: string;
  type: ModelType;
  downloads: DownloadSettings[];
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

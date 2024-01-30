import { DownloadSettings, ModelInfo, ModelType } from '@metastable/types';

export interface DownloadableModel extends ModelInfo {
  type: ModelType;
  downloads: DownloadSettings[];
  recommended?: boolean;
  homepage?: string;
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
  type: ModelType;
  recommended?: boolean;
  description?: string;
}

import { DownloadSettings, ModelMetadata, ModelType } from '@metastable/types';

export interface DownloadableModel extends ModelMetadata {
  type: ModelType;
  downloads: DownloadSettings[];
  recommended?: boolean;
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
  type: ModelType;
  recommended?: boolean;
  description?: string;
}

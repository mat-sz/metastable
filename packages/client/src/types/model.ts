import { ModelType, Model } from '@metastable/types';

export interface DownloadFile {
  filename: string;
  type: ModelType;
  url: string;
  size?: number;
}

export interface DownloadableModel extends Omit<Model, 'id'> {
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

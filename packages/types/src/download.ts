import { ModelMetadata, ModelType } from './model.js';

export interface DownloadData {
  offset: number;
  size: number;
  speed: number;
  name: string;
  url: string;
}

export interface DownloadSettings {
  name: string;
  type: ModelType;
  url: string;
  size?: number;
  imageUrl?: string;
  configUrl?: string;
  configType?: string;
  metadata?: ModelMetadata;
}

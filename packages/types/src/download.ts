import { ModelInfo, ModelType } from './model.js';

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
  info?: ModelInfo;
}

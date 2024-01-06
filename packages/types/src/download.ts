import { ModelInfo } from './model.js';

export interface DownloadData {
  offset: number;
  size: number;
  name: string;
  url: string;
}

export interface DownloadSettings {
  name: string;
  type: string;
  url: string;
  size?: number;
  imageUrl?: string;
  info?: ModelInfo;
}

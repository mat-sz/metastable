import { API } from './types';

declare global {
  interface Window {
    electronAPI: any;
    dataDir?: string;
  }
}

export const ElectronAPI: API = window.electronAPI;

import { API } from './types';

declare global {
  interface Window {
    electronAPI: any;
    electronWindow: any;
    dataDir?: string;
  }
}

interface ElectronWindow {
  close(): void;
  maximize(): void;
  minimize(): void;
  restore(): void;
  onMaximized(callback: (isMaximized: boolean) => void): void;
}

export const ElectronAPI: API = window.electronAPI;
export const ElectronWindow: ElectronWindow = window.electronWindow;

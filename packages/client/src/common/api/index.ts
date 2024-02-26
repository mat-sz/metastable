import { createTRPCClient, createWSClient, wsLink } from '@trpc/client';
import type { Router } from '@metastable/metastable';
import { ipcLink } from 'electron-trpc/renderer';

import { getUrl } from '@utils/url';
import { IS_ELECTRON } from '@utils/config';

declare global {
  interface Window {
    electronWindow?: any;
    dataDir?: string;
    wsOnOpen?: () => void;
    wsOnClose?: () => void;
  }
}

const link = IS_ELECTRON
  ? ipcLink()
  : wsLink({
      client: createWSClient({
        url: getUrl('/trpc', 'ws'),
        onOpen: () => {
          window.wsOnOpen?.();
        },
        onClose: () => {
          window.wsOnClose?.();
        },
      }),
    });

export const API = createTRPCClient<Router>({
  links: [link],
});
interface ElectronWindow {
  close(): void;
  maximize(): void;
  minimize(): void;
  restore(): void;
  onMaximized(callback: (isMaximized: boolean) => void): void;
}

export const ElectronWindow: ElectronWindow = window.electronWindow;

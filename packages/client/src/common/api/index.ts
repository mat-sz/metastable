import {
  createTRPCClient,
  createWSClient,
  httpLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { ipcLink } from 'trpc-electron/renderer';

import { IS_ELECTRON } from '$utils/config';
import { getUrl } from '$utils/url';
import type { Router } from '@metastable/metastable';

declare global {
  interface Window {
    wsIsOpen: boolean;
    wsOnOpen?: () => void;
    wsOnClose?: () => void;
  }
}

window.wsIsOpen = false;

const link = IS_ELECTRON
  ? ipcLink()
  : splitLink({
      condition: op => op.type === 'subscription',
      true: wsLink({
        client: createWSClient({
          url: getUrl('/trpc', 'ws'),
          onOpen: () => {
            window.wsIsOpen = true;
            window.wsOnOpen?.();
          },
          onClose: () => {
            window.wsIsOpen = false;
            window.wsOnClose?.();
          },
        }),
      }),
      false: httpLink({ url: getUrl('/trpc') }),
    });
export const API = createTRPCClient<Router>({
  links: [link],
});

export const TRPC = createTRPCReact<Router>();
export const TRPCClient = TRPC.createClient({
  links: [link],
});

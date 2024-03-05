import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { Router } from '@metastable/metastable';
import { ipcLink } from 'trpc-electron/renderer';

import { getUrl } from '$utils/url';
import { IS_ELECTRON } from '$utils/config';

declare global {
  interface Window {
    dataDir?: string;
    wsOnOpen?: () => void;
    wsOnClose?: () => void;
  }
}

const link = IS_ELECTRON
  ? ipcLink()
  : splitLink({
      condition: op => op.type === 'subscription',
      true: wsLink({
        client: createWSClient({
          url: getUrl('/trpc', 'ws'),
          onOpen: () => {
            window.wsOnOpen?.();
          },
          onClose: () => {
            window.wsOnClose?.();
          },
        }),
      }),
      false: httpBatchLink({ url: getUrl('/trpc') }),
    });
export const API = createTRPCClient<Router>({
  links: [link],
});

export const TRPC = createTRPCReact<Router>();
export const TRPCClient = TRPC.createClient({
  links: [link],
});

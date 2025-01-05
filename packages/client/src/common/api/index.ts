import { createWSClient, httpLink, splitLink, wsLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { toJS } from 'mobx';
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

const transformer = {
  serialize(data: any) {
    return JSON.stringify(toJS(data));
  },
  deserialize(data: any) {
    if (typeof data === 'undefined') {
      return undefined;
    }

    return JSON.parse(data);
  },
};

const link = IS_ELECTRON
  ? ipcLink({ transformer })
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
        transformer,
      }),
      false: httpLink({
        url: getUrl('/trpc'),
        transformer,
      }),
    });

export const TRPC = createTRPCReact<Router>();
export const API = TRPC.createClient({
  links: [link],
});

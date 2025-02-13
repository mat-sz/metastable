import {
  createWSClient,
  httpLink,
  splitLink,
  TRPCLink,
  TRPCWebSocketClient,
  wsLink,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { toJS } from 'mobx';
import { ipcLink } from 'trpc-electron/renderer';

import { IS_ELECTRON } from '$utils/config';
import { BasicEventEmitter } from '$utils/events';
import { getUrl } from '$utils/url';
import type { Router } from '@metastable/metastable';

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

class LinkManager extends BasicEventEmitter<{
  connectionStateChange: (isConnected: boolean) => void;
}> {
  link: TRPCLink<Router>;
  wsClient?: TRPCWebSocketClient;
  tokenCallback?: () => Promise<string | undefined> | string | undefined;
  private _connected = true;

  constructor() {
    super();

    if (IS_ELECTRON) {
      this.link = ipcLink({ transformer });
    } else {
      const getHeaders = async () => ({
        authorization: await this.tokenCallback?.(),
      });

      this._connected = false;
      this.wsClient = createWSClient({
        url: getUrl('/trpc', 'ws'),
        onOpen: () => {
          this._connected = true;
          this.emit('connectionStateChange', true);
        },
        onClose: () => {
          this._connected = false;
          this.emit('connectionStateChange', false);
        },
        connectionParams: getHeaders,
      });

      this.link = splitLink({
        condition: op => op.type === 'subscription',
        true: wsLink({
          client: this.wsClient,
          transformer,
        }),
        false: httpLink({
          url: getUrl('/trpc'),
          transformer,
          headers: getHeaders,
        }),
      });
    }
  }

  get isConnected() {
    return this._connected;
  }

  reconnect() {
    this.wsClient?.reconnect(null);
  }
}

export const linkManager = new LinkManager();

export const TRPC = createTRPCReact<Router>();
export const API = TRPC.createClient({
  links: [linkManager.link],
});

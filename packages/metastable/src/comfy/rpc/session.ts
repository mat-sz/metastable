import { EventEmitter } from 'events';

import { getSessionApi } from './api.js';
import type { RPC } from './rpc.js';
import { RPCSessionLogEvent, RPCSessionProgressEvent } from './types.js';

export type RPCSessionEvents = {
  progress: [event: RPCSessionProgressEvent];
  log: [event: RPCSessionLogEvent];
};

export class RPCSession extends EventEmitter<RPCSessionEvents> {
  readonly api;

  constructor(
    private rpc: RPC,
    private id: string,
  ) {
    super();
    this.api = getSessionApi(this);
  }

  invoke(method: string, params?: Record<string, any>): Promise<unknown> {
    return this.rpc.invoke(this.id, method, params);
  }

  async destroy() {
    try {
      await this.api.session.destroy();
    } catch {}
  }
}

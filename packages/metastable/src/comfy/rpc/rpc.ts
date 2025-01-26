import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

import { LogItem } from '@metastable/types';
import es from 'event-stream';
import { nanoid } from 'nanoid/non-secure';

import { getApi } from './api.js';
import { deserializeObject, serializeObject } from './helpers.js';
import { RPCSession } from './session.js';
import { RPCRequest, RPCResponse } from './types.js';

type RPCEvents = {
  log: [item: LogItem];
  event: [eventName: string, eventData: any];
};

export class RPC extends EventEmitter<RPCEvents> {
  private _readable?: Readable;
  private _writable?: Writable;

  sessions: Record<string, RPCSession> = {};

  rpcCallbacks: Map<
    string,
    {
      resolve: (result: unknown) => void;
      reject: (error: any) => void;
    }
  > = new Map();

  readonly api;

  constructor() {
    super();

    this.api = getApi(this);
  }

  get readable() {
    return this._readable;
  }

  get writable() {
    return this._writable;
  }

  set readable(value: Readable | undefined) {
    this._readable?.removeAllListeners();
    this._readable = value;

    if (this._readable) {
      this._readable.setEncoding('utf-8');
      this._readable.pipe(es.split('\x1e')).on('data', data => {
        try {
          this.handleJson(JSON.parse(data));
        } catch {}
      });
    }
  }

  set writable(value: Writable | undefined) {
    this._writable?.removeAllListeners();
    this._writable = value;

    if (this._writable) {
      this._writable.setDefaultEncoding('utf-8');
    }
  }

  invoke(
    sessionId: string | undefined,
    method: string,
    params?: Record<string, any>,
  ): Promise<unknown> {
    const id = nanoid();
    this.write({
      type: 'rpc',
      method,
      params: serializeObject(params),
      id,
      session: sessionId,
    } as RPCRequest);

    return new Promise((resolve, reject) => {
      this.rpcCallbacks.set(id, { resolve, reject });
    });
  }

  handleRPC(response: RPCResponse) {
    const callbacks = this.rpcCallbacks.get(response.id);
    if (!callbacks) {
      console.log('Unhandled RPC response', response);
      return;
    }

    if (response.error) {
      callbacks.reject(new Error(response.error.message));
    } else {
      callbacks.resolve(deserializeObject(response.result));
    }

    this.rpcCallbacks.delete(response.id);
  }

  async session<T>(
    callback:
      | ((session: RPCSession) => Promise<T>)
      | ((session: RPCSession) => T),
  ): Promise<T> {
    const sessionId = await this.api.session.start();
    const session = new RPCSession(this, sessionId);
    this.sessions[sessionId] = session;

    const result = await callback(session);

    await session.destroy();
    delete this.sessions[sessionId];

    return result;
  }

  handleJson(e: any) {
    if (e.type === 'rpc') {
      this.handleRPC(e);
      return;
    }

    switch (e.event) {
      case 'rpc.progress':
        this.sessions[e.data.sessionId]?.emit('progress', {
          max: e.data.max,
          value: e.data.value,
          preview: e.data.preview,
        });
        break;
      case 'rpc.log':
        this.log(e.data.type, e.data.text);
        this.sessions[e.data.sessionId]?.emit('log', {
          type: e.data.type,
          text: e.data.text,
        });
        break;
      default:
        this.emit('event', e.event, e.data);
    }
  }

  private log(type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    this.emit('log', item);
  }

  reset(error: Error) {
    for (const callbacks of this.rpcCallbacks.values()) {
      callbacks.reject(error);
    }
    this.rpcCallbacks.clear();
  }

  write(data: any) {
    this._writable?.write(JSON.stringify(data) + '\n');
  }
}

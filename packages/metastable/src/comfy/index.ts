import { ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

import { BackendStatus, InstanceInfo, LogItem } from '@metastable/types';
import es from 'event-stream';
import { nanoid } from 'nanoid/non-secure';

import { ComfySession } from './session/index.js';
import { EventEmitter } from '../helpers/events.js';
import type { PythonInstance } from '../python/index.js';

const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

type BackendEvents = {
  log: (data: LogItem) => void;
  reset: () => void;
  status: (status: BackendStatus) => void;
};

interface RPCRequest {
  type: 'rpc';
  method: string;
  params?: Record<string, any>;
  id: string;
  session: string;
}

interface RPCResponse {
  type: 'rpc';
  result?: any;
  error?: {
    message: string;
    data?: any;
  };
  id: string;
}

export class Comfy extends EventEmitter<BackendEvents> {
  process?: ChildProcessWithoutNullStreams;

  sessions: Record<string, ComfySession> = {};
  connected = false;

  rpcCallbacks: Map<
    string,
    {
      resolve: (result: unknown) => void;
      reject: (error: any) => void;
    }
  > = new Map();

  constructor(
    public python: PythonInstance,
    private mainPath = path.join(baseDir, 'python', 'main.py'),
    private args: string[] = [],
    private env: Record<string, string> = {},
  ) {
    super();

    this.start();
  }

  async info() {
    if (!this.connected) {
      return undefined;
    }

    return (await this.invoke(undefined, 'instance:info')) as InstanceInfo;
  }

  invoke(
    sessionId: string | undefined,
    method: string,
    params?: unknown,
  ): Promise<unknown> {
    const id = nanoid();
    this.write({
      type: 'rpc',
      method,
      params,
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
      callbacks.resolve(response.result);
    }
    this.rpcCallbacks.delete(response.id);
  }

  async session<T>(
    callback:
      | ((session: ComfySession) => Promise<T>)
      | ((session: ComfySession) => T),
  ): Promise<T> {
    const sessionId = nanoid();
    await this.invoke(sessionId, 'session:start');
    const session = new ComfySession(this, sessionId);
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
      case 'ready':
        this.setStatus('ready');
        break;
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
    }
  }

  async start() {
    if (this.process?.connected) {
      return;
    }

    const args: string[] = [...this.args];
    const proc = await this.python.spawn([this.mainPath, ...args], {
      ...this.env,
      PYTORCH_MPS_HIGH_WATERMARK_RATIO: '0.0',
    });

    proc.stdin.setDefaultEncoding('utf-8');

    proc.on('spawn', () => this.setStatus('starting'));
    proc.on('exit', () => this.setStatus('error'));

    proc.stdout.setEncoding('utf-8');
    proc.stdout.on('data', data => {
      this.log('stdout', data);
    });

    proc.stderr.setEncoding('utf-8');
    proc.stderr.on('data', data => {
      this.log('stderr', data);
    });

    const jsonOut = proc.stdio[3] as Readable;
    jsonOut.setEncoding('utf-8');
    jsonOut.pipe(es.split('\x1e')).on('data', data => {
      try {
        this.handleJson(JSON.parse(data));
      } catch {}
    });

    this.process = proc;
  }

  stop(force = false) {
    this.process?.kill(force ? 'SIGKILL' : 'SIGTERM');
    this.process = undefined;
  }

  private log(type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    console.log(`[Backend (${type})]`, text);
    this.emit('log', item);
  }

  reset() {
    for (const callbacks of this.rpcCallbacks.values()) {
      callbacks.reject(new Error('Backend abruptly shut down.'));
    }
    this.rpcCallbacks.clear();
    this.emit('reset');
  }

  setStatus(status: BackendStatus) {
    this.connected = status === 'ready';
    if (status !== 'ready') {
      this.reset();
    }

    this.emit('status', status);
  }

  write(data: any) {
    this.process?.stdin.write(JSON.stringify(data) + '\n');
  }
}

import { ChildProcessWithoutNullStreams } from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LogItem,
  ComfyTorchInfo,
  ComfyStatus,
  AnyEvent,
} from '@metastable/types';
import { nanoid } from 'nanoid/non-secure';
import { Readable } from 'stream';
import es from 'event-stream';

import type { PythonInstance } from '../python/index.js';
import { CircularBuffer } from '../helpers/buffer.js';
import { TypedEventEmitter } from '../types.js';
import { ComfySession } from './session.js';

const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

type MetastableEvents = {
  event: (event: AnyEvent) => void;
  log: (data: LogItem[]) => void;
  reset: () => void;
};

interface RPCRequest {
  rpc: true;
  method: string;
  params?: any[];
  id: string;
  session: string;
}

interface RPCResponse {
  rpc: true;
  result?: any;
  error?: {
    message: string;
    data?: any;
  };
  id: string;
}

export class Comfy extends (EventEmitter as {
  new (): TypedEventEmitter<MetastableEvents>;
}) {
  process?: ChildProcessWithoutNullStreams;

  samplers: string[] = [];
  schedulers: string[] = [];
  torchInfo?: ComfyTorchInfo = undefined;
  logBuffer = new CircularBuffer<LogItem>(25);

  status: ComfyStatus = 'starting';
  queue_remaining = 0;

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

  invoke(
    sessionId: string | undefined,
    method: string,
    ...params: unknown[]
  ): Promise<unknown> {
    const id = nanoid();
    this.writeJson({
      rpc: true,
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
  }

  async session<T>(
    callback:
      | ((session: ComfySession) => Promise<T>)
      | ((session: ComfySession) => T),
  ): Promise<T> {
    const sessionId = nanoid();
    await this.invoke(sessionId, 'session:start');
    const session = new ComfySession(this, sessionId);
    const result = await callback(session);
    await this.invoke(sessionId, 'session:destroy');
    return result;
  }

  handleJson(e: any) {
    if ('rpc' in e) {
      this.handleRPC(e);
      return;
    }

    switch (e.event) {
      case 'info.torch':
        this.torchInfo = e.data;
        break;
      case 'info.samplers':
        this.samplers = e.data;
        break;
      case 'info.schedulers':
        this.schedulers = e.data;
        break;
      case 'ready':
        this.setStatus('ready');
        break;
      case 'prompt.queue':
        this.queue_remaining = e.data.queue_remaining;
        break;
    }

    this.emit('event', e);
  }

  async start() {
    if (this.process?.connected) {
      return;
    }

    const args: string[] = [...this.args];
    const proc = this.python.spawn([this.mainPath, ...args], this.env);

    proc.stdin.setDefaultEncoding('utf-8');

    proc.on('spawn', () => this.setStatus('starting'));
    proc.on('close', () => this.setStatus('error'));
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
  }

  private log(type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    this.logBuffer.push(item);
    console.log('Backend', type, text);
    this.emit('log', [item]);
  }

  reset() {
    this.queue_remaining = 0;
    this.torchInfo = undefined;
    this.emit('reset');
  }

  setStatus(status: ComfyStatus) {
    this.status = status;
    if (status !== 'ready') {
      this.reset();
    }

    this.emit('event', { event: 'backend.status', data: status });
  }

  writeJson(data: any) {
    this.process?.stdin.write(JSON.stringify(data) + '\n');
  }

  send(eventName: string, data: any) {
    this.writeJson({ event: eventName, data });
  }
}

import { ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

import { BackendStatus, LogItem } from '@metastable/types';

import type { PythonInstance } from '../python/index.js';
import { RPC } from './rpc/rpc.js';

const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

type BackendEvents = {
  log: [item: LogItem];
  reset: [];
  status: [status: BackendStatus];
  modelCacheChange: [];
};

export class Comfy extends EventEmitter<BackendEvents> {
  process?: ChildProcessWithoutNullStreams;
  connected = false;
  rpc = new RPC();

  constructor(
    public python: PythonInstance,
    private mainPath = path.join(baseDir, 'python', 'main.py'),
    private args: string[] = [],
    private env: Record<string, string> = {},
  ) {
    super();

    this.rpc.on('event', (eventName: string) => {
      switch (eventName) {
        case 'ready':
          this.setStatus('ready');
          break;
        case 'model_cache_change':
          this.emit('modelCacheChange');
          break;
      }
    });
    this.rpc.on('log', ({ type, text }) => {
      this.log(type, text);
    });
    this.start();
  }

  async info() {
    if (!this.connected) {
      return undefined;
    }

    return await this.rpc.api.instance.info();
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

    this.rpc.readable = proc.stdio[3] as Readable;
    this.rpc.writable = proc.stdin;
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
    this.rpc.reset(new Error('Backend shutting down.'));
    this.emit('reset');
  }

  setStatus(status: BackendStatus) {
    this.connected = status === 'ready';
    if (status !== 'ready') {
      this.reset();
    }

    this.emit('status', status);
  }
}

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

import type { PythonInstance } from '../python/index.js';
import { CircularBuffer } from '../helpers/buffer.js';
import { TypedEventEmitter } from '../types.js';

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

  constructor(
    public python: PythonInstance,
    private mainPath = path.join(baseDir, 'python', 'main.py'),
    private args: string[] = [],
    private env: Record<string, string> = {},
  ) {
    super();

    this.start();
  }

  handleJson(e: any) {
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
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');
    proc.on('spawn', () => this.setStatus('starting'));
    proc.on('close', () => this.setStatus('error'));
    proc.on('exit', () => this.setStatus('error'));

    proc.stdout.on('data', data => {
      const split = data.split('\n');
      for (const item of split) {
        if (!item) {
          continue;
        }

        try {
          this.handleJson(JSON.parse(item));
        } catch {
          this.log('stdout', item);
        }
      }
    });

    proc.stderr.on('data', data => {
      this.log('stderr', data);
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

  send(eventName: string, data: any) {
    this.process?.stdin.write(
      JSON.stringify({ event: eventName, data }) + '\n',
    );
  }
}

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import EventEmitter from 'events';
import os from 'os';
import path from 'path';
import { ComfyLogItem, ComfyTorchInfo, ComfyStatus } from '@metastable/types';
import { fileURLToPath } from 'url';

import { getPythonCommand } from './helpers.js';

const baseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export class CircularBuffer<T> {
  private array: T[] = [];

  constructor(private maxLength: number) {}

  get length() {
    return this.array.length;
  }

  push(item: T) {
    if (this.array.length === this.maxLength) {
      this.array.shift();
    }

    this.array.push(item);
  }

  get items() {
    return [...this.array];
  }
}

export class Comfy extends EventEmitter {
  process?: ChildProcessWithoutNullStreams;

  samplers: string[] = [];
  schedulers: string[] = [];
  torchInfo?: ComfyTorchInfo = undefined;
  logBuffer = new CircularBuffer<ComfyLogItem>(25);

  status: ComfyStatus = 'starting';
  queue_remaining = 0;

  constructor() {
    super();

    this.on('event', e => {
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
    });

    this.start();
  }

  get mainPath() {
    return path.join(baseDir, 'python', 'main.py');
  }

  async start() {
    const args: string[] = [];

    if (os.arch() === 'arm64' && os.platform() === 'darwin') {
      // We're running on an M1 Mac.
      args.push('--force-fp16');
    }

    const proc = spawn(
      await getPythonCommand(),
      ['-u', this.mainPath, ...args],
      {
        cwd: process.cwd(),
        detached: true,
        env: {
          ...process.env,
        },
      },
    );

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
          this.emit('event', JSON.parse(item));
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

  private log(type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    this.logBuffer.push(item);
    this.emit('event', {
      event: 'backend.log',
      data: item,
    });
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

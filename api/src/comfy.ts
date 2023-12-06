import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import EventEmitter from 'events';
import os from 'os';

export interface ComfyEvent {
  event: string;
  data: any;
}

export class Comfy extends EventEmitter {
  process: ChildProcessWithoutNullStreams;

  samplers: string[] = [];
  schedulers: string[] = [];

  constructor() {
    super();

    const args: string[] = [];

    if (os.arch() === 'arm64' && os.platform() === 'darwin') {
      // We're running on an M1 Mac.
      args.push('--force-fp16');
    }

    const proc = spawn('python3', ['-u', './python/main.py', ...args], {
      cwd: process.cwd(),
      detached: true,
      env: {
        ...process.env,
      },
    });

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');
    proc.on('spawn', () => console.log('spawn'));
    proc.on('close', () => console.log('close'));
    proc.on('exit', () => console.log('exit'));

    proc.stdout.on('data', data => {
      const split = data.split('\n');
      for (const item of split) {
        if (!item) {
          continue;
        }

        try {
          this.emit('event', JSON.parse(item));
        } catch {
          this.emit('event', { event: 'stdout', data: item.trim() });
        }
      }
    });

    proc.stderr.on('data', data => {
      this.emit('event', { event: 'stderr', data: data.trim() });
    });

    this.on('event', e => {
      if (e.event === 'info.samplers') {
        this.samplers = e.data;
      } else if (e.event === 'info.schedulers') {
        this.schedulers = e.data;
      }
    });

    this.process = proc;
  }

  send(eventName: string, data: any) {
    this.process.stdin.write(JSON.stringify({ event: eventName, data }) + '\n');
  }
}

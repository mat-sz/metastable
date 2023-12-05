import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import EventEmitter from 'events';

export interface ComfyEvent {
  event: string;
  data: any;
}

export class Comfy extends EventEmitter {
  comfy: ChildProcessWithoutNullStreams;

  samplers: string[] = [];
  schedulers: string[] = [];

  constructor() {
    super();

    this.comfy = spawn('python3', ['-u', './python/main.py'], {
      cwd: process.cwd(),
      stdio: 'overlapped',
      detached: true,
      env: {
        ...process.env,
        PYTORCH_MPS_HIGH_WATERMARK_RATIO: '0.0',
      },
    });

    this.comfy.stdin.setDefaultEncoding('utf-8');
    this.comfy.stdout.setEncoding('utf-8');
    this.comfy.stderr.setEncoding('utf-8');
    this.comfy.on('spawn', () => console.log('spawn'));
    this.comfy.on('close', () => console.log('close'));
    this.comfy.on('exit', () => console.log('exit'));

    this.comfy.stdout.on('data', data => {
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

    this.comfy.stderr.on('data', data => {
      this.emit('event', { event: 'stderr', data: data.trim() });
    });

    this.on('event', e => {
      if (e.event === 'info.samplers') {
        this.samplers = e.data;
      } else if (e.event === 'info.schedulers') {
        this.schedulers = e.data;
      }
    });
  }

  send(eventName: string, data: any) {
    this.comfy.stdin.write(JSON.stringify({ event: eventName, data }) + '\n');
  }
}

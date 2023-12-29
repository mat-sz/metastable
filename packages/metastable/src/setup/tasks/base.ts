import { EventEmitter } from 'events';
import { SetupTask } from '@metastable/types';

export class BaseTask extends EventEmitter {
  log: string = '';
  state: SetupTask['state'] = 'queued';
  progress: number = 0;

  async run(): Promise<void> {
    throw new Error('Not implemented');
  }

  appendLog(data: string) {
    if (data.startsWith('\r')) {
      this.log = this.log.substring(0, this.log.lastIndexOf('\n'));
    }

    data = data.replace('\r', '');
    this.log += !this.log ? data : `\n${data}`;
    this.emit('state');
  }

  setState(state: SetupTask['state']) {
    this.state = state;
    this.emit('state');
  }

  setProgress(progress: number) {
    this.progress = progress;
    this.emit('state');
  }
}

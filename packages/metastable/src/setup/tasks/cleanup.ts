import { TaskState } from '@metastable/types';

import { rmdir } from '../../helpers/fs.js';
import { BaseTask } from '../../tasks/task.js';

export class CleanupTask extends BaseTask {
  constructor(private destination: string) {
    super('cleanup', undefined);
  }

  async execute() {
    this.appendLog('Cleaning up...');
    try {
      await rmdir(this.destination);
    } catch {}

    this.appendLog('Done!');

    return TaskState.SUCCESS;
  }
}

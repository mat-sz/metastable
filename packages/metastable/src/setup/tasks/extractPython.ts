import decompress from 'decompress';
import { rimraf } from 'rimraf';
import { TaskState } from '@metastable/types';

import { tryUnlink } from '../../helpers.js';
import { BaseTask } from '../../tasks/task.js';

export class ExtractPythonTask extends BaseTask {
  constructor(
    private archivePath: string,
    private targetPath: string,
  ) {
    super('python.extract', undefined);
  }

  async execute() {
    this.appendLog('Cleaning up...');
    try {
      await rimraf(this.targetPath);
    } catch {}

    this.appendLog(`Extracting ${this.archivePath} to ${this.targetPath}`);

    await decompress(this.archivePath, this.targetPath, { strip: 1 });
    tryUnlink(this.archivePath);

    this.appendLog('Done.');

    return TaskState.SUCCESS;
  }
}

import decompress from 'decompress';
import { rimraf } from 'rimraf';

import { tryUnlink } from '../../helpers.js';
import { BaseTask } from './base.js';

export class ExtractPythonTask extends BaseTask {
  constructor(
    private archivePath: string,
    private targetPath: string,
  ) {
    super();
  }

  async run() {
    this.appendLog('Cleaning up...');
    try {
      await rimraf(this.targetPath);
    } catch {}

    this.appendLog(`Extracting ${this.archivePath} to ${this.targetPath}`);

    await decompress(this.archivePath, this.targetPath, { strip: 1 });
    tryUnlink(this.archivePath);

    this.appendLog('Done.');
  }
}

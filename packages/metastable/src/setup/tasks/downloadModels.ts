import { DownloadSettings, TaskState } from '@metastable/types';

import type { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';

export class DownloadModelsTask extends BaseTask {
  constructor(
    private metastable: Metastable,
    private downloads: DownloadSettings[],
  ) {
    super('models.download', undefined);
  }

  async execute() {
    this.appendLog('Will add your downloads to download manager.');
    for (const download of this.downloads) {
      this.metastable.downloadModel(download);
    }

    return TaskState.SUCCESS;
  }
}

import { DownloadSettings, TaskState } from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseTask } from '../../tasks/task.js';

export class DownloadModelsTask extends BaseTask {
  constructor(private downloads: DownloadSettings[]) {
    super('models.download', undefined);
  }

  async execute() {
    this.appendLog('Will add your downloads to download manager.');
    for (const download of this.downloads) {
      Metastable.instance.downloadModel(download);
    }

    return TaskState.SUCCESS;
  }
}

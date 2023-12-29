import { SetupSettings } from '@metastable/types';

import type { Metastable } from '../../index.js';
import { BaseTask } from './base.js';

export class DownloadModelsTask extends BaseTask {
  constructor(
    private metastable: Metastable,
    private downloads: SetupSettings['downloads'],
  ) {
    super();
  }

  async run() {
    this.appendLog('Will continue your downloads to download manager.');
    for (const download of this.downloads) {
      this.metastable.downloadModel(download);
    }
  }
}

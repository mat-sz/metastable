import { getPythonDownloadUrl } from '../../python/index.js';
import { download } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers.js';
import { BaseTask } from './base.js';

export class DownloadPythonTask extends BaseTask {
  constructor(private archivePath: string) {
    super();
  }

  async run() {
    tryUnlink(this.archivePath);
    this.appendLog('Getting download URL.');
    const url = await getPythonDownloadUrl();
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.archivePath}`);

    await download(url, this.archivePath, task => {
      this.setProgress((task.progress / task.size) * 100);
    });

    this.appendLog('Done.');
  }
}

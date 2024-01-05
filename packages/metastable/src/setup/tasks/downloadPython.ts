import { getPythonDownloadUrl } from '../../python/index.js';
import { BaseDownloadTask } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers.js';

export class DownloadPythonTask extends BaseDownloadTask {
  constructor(savePath: string) {
    super('python.download', '', savePath);
  }

  async init() {
    tryUnlink(this.savePath);
    this.appendLog('Getting download URL.');
    const url = await getPythonDownloadUrl();
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.savePath}`);
    this.url = url;

    await super.init();
  }
}

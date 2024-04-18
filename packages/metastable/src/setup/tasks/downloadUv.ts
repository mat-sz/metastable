import { BaseDownloadTask } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers/fs.js';
import { getLatestReleaseInfo, getPlatform } from '../helpers.js';

async function getUvDownloadUrl(platform: string) {
  const release = await getLatestReleaseInfo('astral-sh/uv');
  const assets = release.assets;

  let findSuffix = `${platform}.tar.gz`;
  if (platform.includes('pc-windows')) {
    findSuffix = `${platform}.zip`;
  }

  let downloadUrl: string | undefined = undefined;

  for (const asset of assets) {
    if (!asset.name.endsWith(findSuffix)) {
      continue;
    }

    downloadUrl = asset.browser_download_url;
    break;
  }

  if (downloadUrl) {
    return downloadUrl;
  }

  throw new Error('Unable to find a suitable uv build');
}

export class DownloadUvTask extends BaseDownloadTask {
  constructor(savePath: string) {
    super('uv.download', '', savePath);
  }

  async init() {
    tryUnlink(this.savePath);
    const platform = await getPlatform(true);
    this.appendLog('Getting download URL.');
    const url = await getUvDownloadUrl(platform);
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.savePath}`);
    this.url = url;

    return await super.init();
  }
}

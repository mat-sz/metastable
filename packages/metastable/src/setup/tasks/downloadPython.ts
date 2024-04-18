import semver, { SemVer } from 'semver';

import { BaseDownloadTask } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers/fs.js';
import { getLatestReleaseInfo, getPlatform } from '../helpers.js';

const REQUIRED_PYTHON_VERSION = '3.11.x';
const REQUIRED_PYTHON_TYPE = 'install_only.tar.gz';

async function getPythonDownloadUrl(platform: string) {
  const release = await getLatestReleaseInfo(
    'indygreg/python-build-standalone',
  );
  const assets = release.assets;

  const findSuffix = `${platform}-${REQUIRED_PYTHON_TYPE}`;
  let highestVer: SemVer | undefined = undefined;
  let downloadUrl: string | undefined = undefined;

  for (const asset of assets) {
    if (!asset.name.endsWith(findSuffix)) {
      continue;
    }

    const split = asset.name.split('-');
    const ver = semver.coerce(split[1]);
    if (!ver || !semver.satisfies(ver, REQUIRED_PYTHON_VERSION)) {
      continue;
    }

    if (!highestVer || semver.gte(ver, highestVer)) {
      highestVer = ver;
      downloadUrl = asset.browser_download_url;
    }
  }

  if (downloadUrl) {
    return downloadUrl;
  }

  throw new Error('Unable to find a suitable Python build');
}

export class DownloadPythonTask extends BaseDownloadTask {
  constructor(savePath: string) {
    super('python.download', '', savePath);
  }

  async init() {
    tryUnlink(this.savePath);
    const platform = await getPlatform();
    this.appendLog('Getting download URL.');
    const url = await getPythonDownloadUrl(platform);
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.savePath}`);
    this.url = url;

    return await super.init();
  }
}

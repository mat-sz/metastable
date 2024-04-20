import os from 'os';
import path from 'path';

import semver, { SemVer } from 'semver';

import { ExtractTask } from './extract.js';
import { BaseDownloadTask } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers/fs.js';
import { SuperTask } from '../../tasks/supertask.js';
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

export class DownloadPythonTask extends SuperTask {
  constructor(private saveDir: string) {
    super('python.download', {});
    this.created();
  }

  async init() {
    const pythonArchivePath = path.join(this.saveDir, 'python.tar.gz');
    const uvArchivePath = path.join(
      this.saveDir,
      os.platform() === 'win32' ? 'uv.zip' : 'uv.tar.gz',
    );

    tryUnlink(pythonArchivePath);
    tryUnlink(uvArchivePath);

    this.appendLog('Getting download URLs.');
    const pythonUrl = await getPythonDownloadUrl(await getPlatform());
    const uvUrl = await getUvDownloadUrl(await getPlatform(true));
    this.appendLog(`Downloading: ${pythonUrl} -> ${pythonArchivePath}`);
    this.appendLog(`Downloading: ${uvUrl} -> ${uvArchivePath}`);
    this.queue.add(
      new BaseDownloadTask('download', pythonUrl, pythonArchivePath),
    );
    this.queue.add(new BaseDownloadTask('download', uvUrl, uvArchivePath));

    const pythonPath = path.join(this.saveDir, 'python');
    const pythonBinPath =
      os.platform() === 'win32'
        ? path.join(this.saveDir, 'python')
        : path.join(this.saveDir, 'python', 'bin');
    this.queue.add(new ExtractTask(pythonArchivePath, pythonPath, true));
    this.queue.add(new ExtractTask(uvArchivePath, pythonBinPath));

    return {};
  }
}

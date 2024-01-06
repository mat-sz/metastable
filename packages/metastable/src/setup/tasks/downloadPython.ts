import os from 'os';
import fs from 'fs/promises';
import semver, { SemVer } from 'semver';

import { BaseDownloadTask } from '../../downloader/index.js';
import { tryUnlink } from '../../helpers/fs.js';

const GH_PYTHON_RELEASE =
  'https://api.github.com/repos/indygreg/python-build-standalone/releases?per_page=1';
const REQUIRED_PYTHON_VERSION = '3.11.x';
const REQUIRED_PYTHON_TYPE = 'install_only.tar.gz';

interface GithubReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  url: string;
  name: string;
  assets: GithubReleaseAsset[];
}

const LINUX_X86_64_VERSION_FLAGS = {
  v2: ['cx16', 'lahf_lm', 'popcnt', 'sse4_1', 'sse4_2', 'ssse3'],
  v3: ['avx', 'avx2', 'bmi1', 'bmi2', 'f16c', 'fma', 'abm', 'movbe', 'xsave'],
  v4: ['avx512f', 'avx512bw', 'avx512cd', 'avx512dq', 'avx512vl'],
};

async function getLinuxArchitecture() {
  if (os.arch() !== 'x64') {
    return undefined;
  }

  const cpuInfo = await fs.readFile('/proc/cpuinfo', { encoding: 'utf-8' });
  const split = cpuInfo.split('\n');
  const line = split.find(line => line.startsWith('flags'));
  if (!line) {
    return undefined;
  }

  const flags = line.split(':')[1]?.trim().split(' ');
  if (!flags) {
    return undefined;
  }

  let archVersion = '';
  for (const [version, versionFlags] of Object.entries(
    LINUX_X86_64_VERSION_FLAGS,
  )) {
    let allFound = true;
    for (const flag of versionFlags) {
      if (!flags.includes(flag)) {
        allFound = false;
        break;
      }
    }

    if (allFound) {
      archVersion = version;
    }
  }

  return archVersion ? `x86_64_${archVersion}` : `x86_64`;
}

async function getPlatform() {
  const platform = os.platform();
  if (platform === 'darwin') {
    if (os.arch() === 'arm64') {
      return 'aarch64-apple-darwin';
    } else if (os.arch() === 'x64') {
      return 'x86_64-apple-darwin';
    }
  } else if (platform === 'win32' && os.arch() === 'x64') {
    return 'x86_64-pc-windows-msvc-shared';
  } else if (platform === 'linux') {
    const arch = await getLinuxArchitecture();
    if (!arch) {
      throw new Error(`Unsupported architecture: ${os.arch()}`);
    }

    return `${arch}-unknown-linux-gnu`;
  }

  throw new Error(`Unsupported platform: ${platform} ${os.arch()}`);
}

async function getLatestReleaseInfo() {
  try {
    const res = await fetch(GH_PYTHON_RELEASE);
    const json = (await res.json()) as GithubRelease[];
    if (!json[0]) {
      throw new Error('No release data available.');
    }
    return json[0];
  } catch (e) {
    throw new Error(`Unable to retrieve latest Python from GitHub, ${e}`);
  }
}

async function getPythonDownloadUrl() {
  const platform = await getPlatform();
  const release = await getLatestReleaseInfo();
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
    this.appendLog('Getting download URL.');
    const url = await getPythonDownloadUrl();
    this.appendLog(`Downloading from: ${url}`);
    this.appendLog(`Will save to: ${this.savePath}`);
    this.url = url;

    await super.init();
  }
}

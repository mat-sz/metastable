import os from 'os';
import path from 'path';

import { memoized, parseNumber } from '#helpers/common.js';
import { exists } from '#helpers/fs.js';
import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'hipInfo';
const SUPPORTED_HIP_SDK_VERSIONS = ['5.7', '6.1'];
const HIP_SDK_PATH = 'C:\\Program Files\\AMD\\ROCm';
const HIP_SDK_HIPINFO = 'bin\\hipInfo.exe';

function getHipSdkPath(version: string) {
  return path.join(HIP_SDK_PATH, version);
}

function getHipInfoPath(version: string) {
  return path.join(getHipSdkPath(version), HIP_SDK_HIPINFO);
}

export async function getHipSdkVersion() {
  for (const version of SUPPORTED_HIP_SDK_VERSIONS) {
    if (await exists(getHipInfoPath(version))) {
      return version;
    }
  }

  return undefined;
}

async function _locateHipInfo() {
  switch (os.platform()) {
    case 'win32': {
      const version = await getHipSdkVersion();
      if (!version) {
        return undefined;
      }

      return getHipInfoPath(version);
    }
  }

  return undefined;
}

const getHipInfo = memoized(_locateHipInfo);

export function parseHipInfo(output: string): HipInfoRow[] {
  const lines = output.split('\n');

  let current: HipInfoRow = {};
  const rows: HipInfoRow[] = [];

  for (const line of lines) {
    if (line.includes(':')) {
      const split = line.split(':').map(part => part.trim());
      current[split[0]] = split[1];
    } else if (line.includes('device#')) {
      if (Object.keys(current).length) {
        rows.push(current);
      }
      current = {};
    }
  }

  if (Object.keys(current).length) {
    rows.push(current);
  }

  return rows;
}

type HipInfoRow = Record<string, string>;
async function hipInfo(): Promise<HipInfoRow[]> {
  const hipInfoPath = await getHipInfo();
  if (!hipInfoPath) {
    throw new Error('Unable to find hipInfo');
  }

  const output = await stdout(hipInfoPath);
  return parseHipInfo(output);
}

const UNIT_MULTIPLIER: Record<string, number> = {
  TB: 1024 * 1024 * 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MB: 1024 * 1024,
  KB: 1024,
};

function parseMemory(str: string) {
  const split = str.split(' ');
  const number = parseNumber(split[0]);
  if (!number) {
    return undefined;
  }

  const unit = split[1];
  const output = number * (UNIT_MULTIPLIER[unit] || 0);
  return Math.floor(output);
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return !!(await getHipInfo());
  },
  async devices() {
    const rows = await hipInfo();
    return rows.map(row => {
      const vram =
        parseMemory(row['memInfo.total'] || row['totalGlobalMem']) || 0;
      const vramFree = parseMemory(row['memInfo.free']);

      return {
        source: PROVIDER_ID,
        name: row['Name'],
        vendor: getVendor(row['Name']),
        busAddress: normalizeBusAddress(
          `${row['pciBusID']}:${row['pciDeviceID']}.${row['pciDomainID']}`,
        ),
        vram,
        memoryUsed: typeof vramFree === 'number' ? vram - vramFree : undefined,
      };
    });
  },
  async utilization() {
    const rows = await hipInfo();
    return rows.map(row => {
      const vram =
        parseMemory(row['memInfo.total'] || row['totalGlobalMem']) || 0;
      const vramFree = parseMemory(row['memInfo.free']);

      return {
        source: PROVIDER_ID,
        vendor: getVendor(row['Name']),
        vram,
        memoryUsed: typeof vramFree === 'number' ? vram - vramFree : undefined,
      };
    });
  },
};

export default provider;

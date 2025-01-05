import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import which from 'which';

import { memoized, parseNumber } from '#helpers/common.js';
import { stdout } from '#helpers/spawn.js';
import { normalizeBusAddress } from '../helpers.js';
import { GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'nvidia-smi';
const WINDIR = process.env.WINDIR || 'C:\\Windows';

async function _locateSmi() {
  switch (os.platform()) {
    case 'win32': {
      const basePath = WINDIR + '\\System32\\DriverStore\\FileRepository';
      // find all directories that have an nvidia-smi.exe file
      const candidates = await Promise.all(
        (await fs.readdir(basePath)).map(async dir => {
          const filePath = path.join(basePath, dir, 'nvidia-smi.exe');
          try {
            const stat = await fs.stat(filePath);
            return {
              filePath,
              stat,
            };
          } catch {
            return undefined;
          }
        }),
      );
      const sorted = candidates
        .filter(item => typeof item === 'object')
        .sort((a, b) => b.stat.ctimeMs - a.stat.ctimeMs);
      const first = sorted[0].filePath;
      return first || undefined;
    }
    case 'linux':
      return await which('nvidia-smi');
  }

  return undefined;
}

const getNvidiaSmi = memoized(_locateSmi);

async function nvidiaSmi<
  TColumns extends string[],
  TResult = { [K in TColumns[number]]: string | undefined },
>(columns: readonly [...TColumns]): Promise<TResult[]> {
  const nvidiaSmiPath = await getNvidiaSmi();
  if (!nvidiaSmiPath) {
    throw new Error('Unable to find nvidia-smi');
  }

  const output = (
    await stdout(nvidiaSmiPath, [
      `--query-gpu=${columns.join(',')}`,
      '--format=csv,noheader,nounits',
    ])
  ).split('\n');
  const result: any[] = [];
  for (const line of output) {
    const split = line.split(', ');
    if (split.length !== columns.length) {
      continue;
    }

    result.push(
      Object.fromEntries(
        columns.map((column, i) => [
          column,
          split[i].includes('N/A') ? undefined : split[i],
        ]),
      ),
    );
  }
  return result;
}

const devicesColumns = [
  'pci.sub_device_id',
  'name',
  'pci.bus_id',
  'fan.speed',
  'memory.total',
  'memory.used',
  'memory.free',
  'utilization.gpu',
  'utilization.memory',
  'temperature.gpu',
  'temperature.memory',
  'power.draw',
  'power.limit',
  'clocks.gr',
  'clocks.mem',
] as const;

const utilizationColumns = [
  'memory.total',
  'memory.used',
  'memory.free',
  'utilization.gpu',
  'temperature.gpu',
] as const;

function parseMemory(memory?: string | number | null) {
  const out = parseNumber(memory);
  if (typeof out === 'number') {
    return out * 1024 * 1024;
  }

  return 0;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return !!(await getNvidiaSmi());
  },
  async devices() {
    const gpus = await nvidiaSmi(devicesColumns);

    return gpus.map(gpu => ({
      source: PROVIDER_ID,
      subDeviceId: gpu['pci.sub_device_id'],
      name: gpu['name'],
      vendor: 'NVIDIA',
      busAddress: normalizeBusAddress(gpu['pci.bus_id']),
      vram: parseMemory(gpu['memory.total']),
      memoryUsed: parseMemory(gpu['memory.used']),
      utilizationGpu: parseNumber(gpu['utilization.gpu']),
      temperatureGpu: parseNumber(gpu['temperature.gpu']),
    }));
  },
  async utilization() {
    const gpus = await nvidiaSmi(utilizationColumns);

    return gpus.map(gpu => ({
      source: PROVIDER_ID,
      vendor: 'NVIDIA',
      vram: parseMemory(gpu['memory.total']),
      memoryUsed: parseMemory(gpu['memory.used']),
      utilizationGpu: parseNumber(gpu['utilization.gpu']),
      temperatureGpu: parseNumber(gpu['temperature.gpu']),
    }));
  },
};

export default provider;

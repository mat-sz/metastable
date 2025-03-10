import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import which from 'which';

import { memoized, parseNumber } from '#helpers/common.js';
import { dirnames } from '#helpers/fs.js';
import { stdout } from '#helpers/spawn.js';
import { PATH_PROGRAM_FILES, PATH_SYSTEM32 } from '../../win32.js';
import { normalizeBusAddress } from '../helpers.js';
import { GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'nvidia-smi';

async function _locateSmiWin32() {
  const whichSmi = await which('nvidia-smi.exe');
  if (whichSmi) {
    return whichSmi;
  }

  const system32Path = PATH_SYSTEM32;
  const fileRepositoryPath = path.join(
    system32Path,
    'DriverStore',
    'FileRepository',
  );
  const fileRepositoryFolders = await dirnames(fileRepositoryPath);

  // Find all directories that include an nvidia-smi.exe file.
  const candidateFolders = [
    ...fileRepositoryFolders
      .filter(name => name.startsWith('nv'))
      .map(name => path.join(fileRepositoryPath, name)),
    path.join(PATH_PROGRAM_FILES, 'NVIDIA Corporation', 'NVSMI'),
  ];

  const candidates = await Promise.all(
    candidateFolders.map(async dir => {
      const filePath = path.join(dir, 'nvidia-smi.exe');
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

async function _locateSmi() {
  switch (os.platform()) {
    case 'win32':
      return await _locateSmiWin32();
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

const devicesColumns = ['name', 'pci.bus_id', 'memory.total'] as const;

const utilizationColumns = [
  'pci.bus_id',
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
      name: gpu['name'],
      vendor: 'NVIDIA',
      busAddress: normalizeBusAddress(gpu['pci.bus_id']),
      vram: parseMemory(gpu['memory.total']),
    }));
  },
  async utilization() {
    const gpus = await nvidiaSmi(utilizationColumns);

    return gpus.map(gpu => ({
      source: PROVIDER_ID,
      vendor: 'NVIDIA',
      vram: parseMemory(gpu['memory.total']),
      vramUsed: parseMemory(gpu['memory.used']),
      busAddress: normalizeBusAddress(gpu['pci.bus_id']),
      utilization: parseNumber(gpu['utilization.gpu']),
      temperature: parseNumber(gpu['temperature.gpu']),
    }));
  },
};

export default provider;

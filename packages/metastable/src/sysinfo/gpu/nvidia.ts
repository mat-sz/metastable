import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import which from 'which';

import { parseNumber } from '../../helpers/common.js';
import { stdout } from '../../helpers/spawn.js';
import {
  GraphicsControllerData,
  GraphicsControllerUtilization,
} from '../types.js';
import * as util from '../util.js';

let _nvidiaSmiPath: string | undefined = undefined;
let _nvidiaSmiRetry = true;

async function getNvidiaSmi() {
  if (_nvidiaSmiPath) {
    return _nvidiaSmiPath;
  }

  if (!_nvidiaSmiRetry) {
    return false;
  }

  switch (os.platform()) {
    case 'win32':
      try {
        const basePath =
          util.WINDIR + '\\System32\\DriverStore\\FileRepository';
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
        if (first) {
          _nvidiaSmiPath = first;
        }
      } catch {
        _nvidiaSmiRetry = false;
      }
      break;
    case 'linux':
      try {
        _nvidiaSmiPath = await which('nvidia-smi');
      } catch {
        _nvidiaSmiRetry = false;
      }
      break;
  }

  return _nvidiaSmiPath;
}

export async function nvidiaSmi<
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

function parseMemory(memory?: string | number | null) {
  const out = parseNumber(memory);
  if (typeof out === 'number') {
    return out * 1024 * 1024;
  }

  return 0;
}

export async function nvidiaDevices(): Promise<GraphicsControllerData[]> {
  const gpus = await nvidiaSmi(devicesColumns);

  return gpus.map(gpu => {
    const vram = parseMemory(gpu['memory.total']);
    return {
      subDeviceId: gpu['pci.sub_device_id'],
      name: gpu['name'],
      vendor: 'NVIDIA',
      pciBus: gpu['pci.bus_id'],
      memoryTotal: vram,
      memoryUsed: parseMemory(gpu['memory.used']),
      utilizationGpu: parseNumber(gpu['utilization.gpu']),
      temperatureGpu: parseNumber(gpu['temperature.gpu']),
      vram: vram,
      vramDynamic: false,
      bus: 'PCI',
    };
  });
}

const utilizationColumns = [
  'memory.total',
  'memory.used',
  'memory.free',
  'utilization.gpu',
  'temperature.gpu',
] as const;

export async function nvidiaUtilization(): Promise<
  GraphicsControllerUtilization[]
> {
  const gpus = await nvidiaSmi(utilizationColumns);

  return gpus.map(gpu => ({
    memoryTotal: parseMemory(gpu['memory.total']),
    memoryUsed: parseMemory(gpu['memory.used']),
    utilizationGpu: parseNumber(gpu['utilization.gpu']),
    temperatureGpu: parseNumber(gpu['temperature.gpu']),
  }));
}

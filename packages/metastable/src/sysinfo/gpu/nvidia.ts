import fs from 'fs/promises';
import path from 'path';

import { parseNumber } from '../../helpers/common.js';
import { shell } from '../../helpers/spawn.js';
import * as util from '../util.js';

const _platform = process.platform;
let _nvidiaSmiPath: string | undefined = undefined;
let _nvidiaSmiRetry = true;

const _linux = _platform === 'linux' || _platform === 'android';
const _windows = _platform === 'win32';

async function getNvidiaSmi() {
  if (!_nvidiaSmiRetry) {
    return false;
  }

  if (_nvidiaSmiPath) {
    return _nvidiaSmiPath;
  }

  if (_windows) {
    try {
      const basePath = util.WINDIR + '\\System32\\DriverStore\\FileRepository';
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
  } else if (_linux) {
    _nvidiaSmiPath = 'nvidia-smi';
    // TODO: Check if present.
  }

  return _nvidiaSmiPath;
}

export async function nvidiaSmi<
  TColumns extends string[],
  TResult = { [K in TColumns[number]]: string | undefined },
>(columns: readonly [...TColumns]): Promise<TResult[]> {
  const nvidiaSmiExe = await getNvidiaSmi();
  if (!nvidiaSmiExe) {
    throw new Error('Unable to find nvidia-smi');
  }

  const nvidiaSmiOpts = `--query-gpu=${columns.join(',')} --format=csv,noheader,nounits`;
  const cmd =
    nvidiaSmiExe + ' ' + nvidiaSmiOpts + (_linux ? '  2>/dev/null' : '');

  const output = (await shell(cmd)).split('\n');
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
  'driver_version',
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

export async function nvidiaDevices() {
  const gpus = await nvidiaSmi(devicesColumns);

  return gpus.map(gpu => {
    const vram = parseMemory(gpu['memory.total']);
    return {
      driverVersion: gpu['driver_version'],
      subDeviceId: gpu['pci.sub_device_id'],
      name: gpu['name'],
      pciBus: gpu['pci.bus_id'],
      fanSpeed: parseNumber(gpu['fan.speed']),
      memoryTotal: vram,
      memoryUsed: parseMemory(gpu['memory.used']),
      memoryFree: parseMemory(gpu['memory.free']),
      utilizationGpu: parseNumber(gpu['utilization.gpu']),
      utilizationMemory: parseNumber(gpu['utilization.memory']),
      temperatureGpu: parseNumber(gpu['temperature.gpu']),
      temperatureMemory: parseNumber(gpu['temperature.memory']),
      powerDraw: parseNumber(gpu['power.draw']),
      powerLimit: parseNumber(gpu['power.limit']),
      clockCore: parseNumber(gpu['clocks.gr']),
      clockMemory: parseNumber(gpu['clocks.mem']),
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

export async function nvidiaUtilization() {
  const gpus = await nvidiaSmi(utilizationColumns);

  return gpus.map(gpu => ({
    memoryTotal: parseMemory(gpu['memory.total']),
    memoryUsed: parseMemory(gpu['memory.used']),
    memoryFree: parseMemory(gpu['memory.free']),
    utilizationGpu: parseNumber(gpu['utilization.gpu']),
    temperatureGpu: parseNumber(gpu['temperature.gpu']),
  }));
}

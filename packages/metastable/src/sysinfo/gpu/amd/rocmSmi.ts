/* eslint-disable @typescript-eslint/no-empty-object-type */
import os from 'os';

import which from 'which';

import { memoized, parseNumber } from '#helpers/common.js';
import { stdout } from '#helpers/spawn.js';
import { normalizeBusAddress } from '../helpers.js';
import { GPUInfoProvider } from '../types.js';

async function _locateSmi() {
  switch (os.platform()) {
    case 'linux':
      return await which('rocm-smi');
  }

  return undefined;
}

const getRocmSmi = memoized(_locateSmi);

interface RocmSmiShow {
  meminfoVram?: boolean;
  id?: boolean;
  bus?: boolean;
  use?: boolean;
  temp?: boolean;
  maxPower?: boolean;
  clocks?: boolean;
  gpuClocks?: boolean;
  power?: boolean;
  productName?: boolean;
}

type RocmSmiRow<TShow extends RocmSmiShow> = (TShow['meminfoVram'] extends true
  ? {
      'VRAM Total Memory (B)'?: string;
      'VRAM Total Used Memory (B)'?: string;
    }
  : {}) &
  (TShow['id'] extends true
    ? { 'Device ID'?: string; 'Device Rev'?: string }
    : {}) &
  (TShow['bus'] extends true ? { 'PCI Bus'?: string } : {}) &
  (TShow['use'] extends true
    ? { 'GPU use (%)'?: string; 'GFX Activity'?: string }
    : {}) &
  (TShow['temp'] extends true
    ? {
        'Temperature (Sensor junction) (C)'?: string;
        'Temperature (Sensor memory) (C)'?: string;
      }
    : {}) &
  (TShow['maxPower'] extends true
    ? { 'Max Graphics Package Power (W)'?: string }
    : {}) &
  (TShow['clocks'] extends true
    ? {
        'fclk clock speed:'?: string;
        'fclk clock level:'?: string;
        'mclk clock speed:'?: string;
        'mclk clock level:'?: string;
        'sclk clock speed:'?: string;
        'sclk clock level:'?: string;
        'socclk clock speed:'?: string;
        'socclk clock level:'?: string;
      }
    : {}) &
  (TShow['gpuClocks'] extends true ? { 'sclk clock level'?: string } : {}) &
  (TShow['power'] extends true
    ? { 'Current Socket Graphics Package Power (W)'?: string }
    : {}) &
  (TShow['productName'] extends true
    ? {
        'Card series'?: string;
        'Card model'?: string;
        'Card vendor'?: string;
        'Card SKU'?: string;
      }
    : {});

async function rocmSmi<TShow extends RocmSmiShow>(
  show: TShow,
): Promise<RocmSmiRow<TShow>[]> {
  const rocmSmiPath = await getRocmSmi();
  if (!rocmSmiPath) {
    throw new Error('Unable to find rocm-smi');
  }

  const args: string[] = ['--json'];
  for (const [key, value] of Object.entries(show)) {
    if (!value) {
      continue;
    }

    if (key === 'meminfoVram') {
      args.push('--showmeminfo', 'vram');
      continue;
    }

    args.push(`--show${key.toLowerCase()}`);
  }

  const output = await stdout(rocmSmiPath, args);
  return Object.values(JSON.parse(output)) as any[];
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return !!(await getRocmSmi());
  },
  async devices() {
    const gpus = await rocmSmi({
      meminfoVram: true,
      bus: true,
      id: true,
      productName: true,
      use: true,
      temp: true,
    });

    return gpus.map(gpu => {
      const vram = parseNumber(gpu['VRAM Total Memory (B)']);
      const vramUsed = parseNumber(gpu['VRAM Total Used Memory (B)']);
      return {
        subDeviceId: gpu['Device ID'],
        name: gpu['Card model'],
        model: gpu['Card model'],
        vendor: gpu['Card vendor'],
        busAddress: normalizeBusAddress(gpu['PCI Bus']),
        memoryTotal: vram,
        memoryUsed: vramUsed,
        utilizationGpu: parseNumber(gpu['GPU use (%)']),
        temperatureGpu: parseNumber(gpu['Temperature (Sensor junction) (C)']),
        vram: vram || 0,
        vramDynamic: false,
        bus: 'PCI',
      };
    });
  },
  async utilization() {
    const gpus = await rocmSmi({
      meminfoVram: true,
      use: true,
      temp: true,
    });

    return gpus.map(gpu => ({
      memoryTotal: parseNumber(gpu['VRAM Total Memory (B)']),
      memoryUsed: parseNumber(gpu['VRAM Total Used Memory (B)']),
      utilizationGpu: parseNumber(gpu['GPU use (%)']),
      temperatureGpu: parseNumber(gpu['Temperature (Sensor junction) (C)']),
    }));
  },
};

export default provider;

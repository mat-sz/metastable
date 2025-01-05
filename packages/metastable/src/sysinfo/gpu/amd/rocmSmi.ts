/* eslint-disable @typescript-eslint/no-empty-object-type */
import os from 'os';

import which from 'which';

import { memoized, parseNumber } from '#helpers/common.js';
import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'rocm-smi';

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
      productName: true,
    });

    return gpus.map(gpu => {
      const vram = parseNumber(gpu['VRAM Total Memory (B)']) || 0;
      return {
        source: PROVIDER_ID,
        name: gpu['Card model'],
        vendor: getVendor(gpu['Card vendor']),
        busAddress: normalizeBusAddress(gpu['PCI Bus']),
        vram,
      };
    });
  },
  async utilization() {
    const gpus = await rocmSmi({
      meminfoVram: true,
      bus: true,
      use: true,
      temp: true,
      productName: true,
    });

    return gpus.map(gpu => {
      const vram = parseNumber(gpu['VRAM Total Memory (B)']) || 0;
      return {
        source: PROVIDER_ID,
        vendor: getVendor(gpu['Card vendor']),
        busAddress: normalizeBusAddress(gpu['PCI Bus']),
        vram,
        vramUsed: parseNumber(gpu['VRAM Total Used Memory (B)']),
        utilization: parseNumber(gpu['GPU use (%)']),
        temperature: parseNumber(gpu['Temperature (Sensor junction) (C)']),
      };
    });
  },
};

export default provider;

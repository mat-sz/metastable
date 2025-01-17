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
      'vram total memory (b)'?: string;
      'vram total used memory (b)'?: string;
    }
  : {}) &
  (TShow['id'] extends true
    ? { 'device id'?: string; 'device rev'?: string }
    : {}) &
  (TShow['bus'] extends true ? { 'pci bus'?: string } : {}) &
  (TShow['use'] extends true
    ? { 'gpu use (%)'?: string; 'gfx activity'?: string }
    : {}) &
  (TShow['temp'] extends true
    ? {
        'temperature (sensor junction) (c)'?: string;
        'temperature (sensor memory) (c)'?: string;
        'temperature (sensor edge) (c)'?: string;
      }
    : {}) &
  (TShow['maxPower'] extends true
    ? { 'max graphics package power (w)'?: string }
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
    ? { 'current socket graphics package power (w)'?: string }
    : {}) &
  (TShow['productName'] extends true
    ? {
        'card series'?: string;
        'card model'?: string;
        'card vendor'?: string;
        'card sku'?: string;
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
  const cards = Object.values(JSON.parse(output)) as any[];
  return cards.map(card =>
    Object.fromEntries(
      Object.entries(card).map(([key, value]) => [key.toLowerCase(), value]),
    ),
  );
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
      const vram = parseNumber(gpu['vram total memory (b)']) || 0;
      return {
        source: PROVIDER_ID,
        name: gpu['card model'],
        vendor: getVendor(gpu['card vendor']),
        busAddress: normalizeBusAddress(gpu['pci bus']),
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
      const vram = parseNumber(gpu['vram total memory (b)']) || 0;
      return {
        source: PROVIDER_ID,
        vendor: getVendor(gpu['card vendor']),
        busAddress: normalizeBusAddress(gpu['pci bus']),
        vram,
        vramUsed: parseNumber(gpu['vram total used memory (b)']),
        utilization: parseNumber(gpu['gpu use (%)']),
        temperature: parseNumber(
          gpu['temperature (sensor junction) (c)'] ||
            gpu['temperature (sensor memory) (c)'] ||
            gpu['temperature (sensor edge) (c)'],
        ),
      };
    });
  },
};

export default provider;

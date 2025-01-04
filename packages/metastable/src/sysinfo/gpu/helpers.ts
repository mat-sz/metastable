import { GPUInfo } from './types.js';

export function normalizeBusAddress(address?: string) {
  if (!address) {
    return undefined;
  }

  const split = address.toLowerCase().split(':');

  if (split.length === 3) {
    split[0] = split[0].padStart(8, '0');
  } else if (split.length === 2) {
    split.unshift('00000000');
  }

  split[1] = split[1].padStart(2, '0');
  split[2] = split[2]
    .split('.')
    .map(part => part.padStart(2, '0'))
    .join('.');

  return split.join(':');
}

export function deduplicateInfo(devices: GPUInfo[]) {
  const map: Record<string, GPUInfo[]> = {};

  for (const device of devices) {
    if (!device.busAddress) {
      continue;
    }

    if (!map[device.busAddress]) {
      map[device.busAddress] = [];
    }

    map[device.busAddress].push(device);
  }

  const newDevices: GPUInfo[] = [];
  for (const busAddress of Object.keys(map)) {
    const items = map[busAddress];
    newDevices.push(
      items.reduce((previous, current) => ({ ...previous, ...current })),
    );
  }

  return newDevices;
}

export function getVendor(name = '') {
  const normalized = name.toLowerCase();

  if (normalized.includes('nvidia')) {
    return 'NVIDIA';
  }

  if (normalized.includes('amd') || normalized.includes('advanced')) {
    return 'AMD';
  }

  if (normalized.includes('intel')) {
    return 'Intel';
  }

  return 'Unknown';
}

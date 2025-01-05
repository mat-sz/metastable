import os from 'os';

import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'clinfo';
const RE_FIELD = /\[([^\]]+)\]\s+(\w+)\s+(.*)/;
const RE_TOPOLOGY = /[a-zA-Z0-9]+:\d+\.\d+/;

function parseLines(lines: string[]) {
  const devices: Record<string, Record<string, string>> = {};
  for (const line of lines) {
    const field = RE_FIELD.exec(line.trim())?.slice(1);
    if (field?.length === 3) {
      const [deviceId, key, value] = field;
      if (!devices[deviceId]) {
        devices[deviceId] = {};
      }
      devices[deviceId][key] = value;
    }
  }

  const gpus: GPUInfo[] = [];
  for (const device of Object.values(devices)) {
    if (device['CL_DEVICE_TYPE'] !== 'CL_DEVICE_TYPE_GPU') {
      continue;
    }

    let busAddress;
    const topology =
      device['CL_DEVICE_PCI_BUS_INFO_KHR'] || device['CL_DEVICE_TOPOLOGY_AMD'];
    if (topology) {
      const bdf = topology.match(RE_TOPOLOGY);
      busAddress = bdf?.[0];
    } else if (
      device['CL_DEVICE_PCI_BUS_ID_NV'] &&
      device['CL_DEVICE_PCI_SLOT_ID_NV']
    ) {
      const bus = parseInt(device['CL_DEVICE_PCI_BUS_ID_NV']);
      const slot = parseInt(device['CL_DEVICE_PCI_SLOT_ID_NV']);
      if (!isNaN(bus) && !isNaN(slot)) {
        const b = bus & 0xff;
        const d = (slot >> 3) & 0xff;
        const f = slot & 0x07;
        busAddress = `${b.toString(16)}:${d.toString(16)}.${f.toString(16)}`;
      }
    }

    if (busAddress) {
      gpus.push({
        source: PROVIDER_ID,
        busAddress: normalizeBusAddress(busAddress),
        vendor: getVendor(device['CL_DEVICE_VENDOR']),
        name: device['CL_DEVICE_BOARD_NAME_AMD'] || device['CL_DEVICE_NAME'],
        vram: parseInt(device['CL_DEVICE_GLOBAL_MEM_SIZE']) || 0,
      });
    }
  }
  return gpus;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'linux';
  },
  async devices() {
    const lines = (await stdout('clinfo', ['--raw'])).split('\n');
    return parseLines(lines);
  },
};

export default provider;

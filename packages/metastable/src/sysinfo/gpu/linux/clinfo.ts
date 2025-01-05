import os from 'os';

import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'clinfo';

function parseLines(lines: string[]) {
  const controllers: GPUInfo[] = [];
  const fieldPattern = /\[([^\]]+)\]\s+(\w+)\s+(.*)/;
  const devices = lines.reduce(
    (devices, line) => {
      const field = fieldPattern.exec(line.trim());
      if (field) {
        if (!devices[field[1]]) {
          devices[field[1]] = {};
        }
        devices[field[1]][field[2]] = field[3];
      }
      return devices;
    },
    {} as Record<string, Record<string, string>>,
  );
  for (const deviceId in devices) {
    const device = devices[deviceId];
    if (device['CL_DEVICE_TYPE'] === 'CL_DEVICE_TYPE_GPU') {
      let busAddress;
      if (device['CL_DEVICE_TOPOLOGY_AMD']) {
        const bdf = device['CL_DEVICE_TOPOLOGY_AMD'].match(
          /[a-zA-Z0-9]+:\d+\.\d+/,
        );
        if (bdf) {
          busAddress = bdf[0];
        }
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
          busAddress = `${b.toString().padStart(2, '0')}:${d.toString().padStart(2, '0')}.${f}`;
        }
      }
      if (busAddress) {
        const controller: GPUInfo = {
          source: PROVIDER_ID,
          vendor: getVendor(device['CL_DEVICE_VENDOR']),
          name: device['CL_DEVICE_BOARD_NAME_AMD'] || device['CL_DEVICE_NAME'],
          busAddress: normalizeBusAddress(busAddress),
          vram: 0,
        };
        const memory = parseInt(device['CL_DEVICE_GLOBAL_MEM_SIZE']);
        if (!isNaN(memory)) {
          controller.vram = memory;
        }
        controllers.push(controller);
      }
    }
  }
  return controllers;
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

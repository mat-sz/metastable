import os from 'os';

import * as util from '../../util.js';
import { getVendor } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'powershell';

function matchDeviceId(str: string) {
  // Match PCI device identifier (there's an order of increasing generality):
  // https://docs.microsoft.com/en-us/windows-hardware/drivers/install/identifiers-for-pci-devices

  // PCI\VEN_v(4)&DEV_d(4)&SUBSYS_s(4)n(4)&REV_r(2)
  // PCI\VEN_v(4)&DEV_d(4)&SUBSYS_s(4)n(4)
  // PCI\VEN_v(4)&DEV_d(4)&REV_r(2)
  // PCI\VEN_v(4)&DEV_d(4)

  const matchingDeviceId = str.match(
    /PCI\\(VEN_[0-9A-F]{4})&(DEV_[0-9A-F]{4})(?:&(SUBSYS_[0-9A-F]{8}))?(?:&(REV_[0-9A-F]{2}))?/i,
  );
  return matchingDeviceId?.[0].toUpperCase();
}

function parseLines(sections: string[], vections: string[]): GPUInfo[] {
  const memorySizes: Record<string, number> = {};
  for (const i in vections) {
    if ({}.hasOwnProperty.call(vections, i)) {
      if (vections[i].trim() !== '') {
        const lines = vections[i].trim().split('\n');
        const id = matchDeviceId(util.getValue(lines, 'MatchingDeviceId'));
        if (id) {
          const quadWordmemorySize = parseInt(
            util.getValue(lines, 'HardwareInformation.qwMemorySize'),
          );
          if (!isNaN(quadWordmemorySize)) {
            memorySizes[id] = quadWordmemorySize;
          }
        }
      }
    }
  }

  const controllers: GPUInfo[] = [];
  for (const i in sections) {
    if ({}.hasOwnProperty.call(sections, i)) {
      if (sections[i].trim() !== '') {
        const lines = sections[i].trim().split('\n');
        const id = matchDeviceId(util.getValue(lines, 'PNPDeviceID', ':'));

        let memorySize: number | undefined = undefined;
        if (id) {
          if (memorySizes[id]) {
            memorySize = memorySizes[id];
          }
        }

        controllers.push({
          source: PROVIDER_ID,
          vendor: getVendor(util.getValue(lines, 'AdapterCompatibility', ':')),
          name: util.getValue(lines, 'name', ':'),
          vram:
            typeof memorySize !== 'number'
              ? util.toInt(util.getValue(lines, 'AdapterRAM', ':'))
              : memorySize,
        });
      }
    }
  }
  return controllers;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'win32';
  },
  async devices() {
    const workload = [];
    workload.push(
      util.powerShell('Get-CimInstance win32_VideoController | fl *'),
    );
    workload.push(
      util.powerShell(
        'gp "HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*" -ErrorAction SilentlyContinue | where MatchingDeviceId $null -NE | select MatchingDeviceId,HardwareInformation.qwMemorySize | fl',
      ),
    );

    const data = await Promise.all(workload);

    const csections = data[0].replace(/\r/g, '').split(/\n\s*\n/);
    const vsections = data[1].replace(/\r/g, '').split(/\n\s*\n/);
    return parseLines(csections, vsections);
  },
};

export default provider;

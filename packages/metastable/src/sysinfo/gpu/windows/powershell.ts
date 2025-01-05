import os from 'os';

import { parseNumber } from '#helpers/common.js';
import { parseFl, powerShell } from '../../powershell.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'powershell';

function matchDeviceId(str?: string) {
  // Match PCI device identifier (there's an order of increasing generality):
  // https://docs.microsoft.com/en-us/windows-hardware/drivers/install/identifiers-for-pci-devices

  // PCI\VEN_v(4)&DEV_d(4)&SUBSYS_s(4)n(4)&REV_r(2)
  // PCI\VEN_v(4)&DEV_d(4)&SUBSYS_s(4)n(4)
  // PCI\VEN_v(4)&DEV_d(4)&REV_r(2)
  // PCI\VEN_v(4)&DEV_d(4)
  if (!str) {
    return undefined;
  }

  const matchingDeviceId = str.match(
    /PCI\\(VEN_[0-9A-F]{4})&(DEV_[0-9A-F]{4})(?:&(SUBSYS_[0-9A-F]{8}))?(?:&(REV_[0-9A-F]{2}))?/i,
  );
  return matchingDeviceId?.[0].toUpperCase();
}

function parseLines(output: string[][]): GPUInfo[] {
  const memorySizes: Record<string, number> = {};
  for (const data of output[2]) {
    const obj = parseFl(data);
    const id = matchDeviceId(obj['MatchingDeviceId']);
    if (id) {
      const quadWordmemorySize = parseInt(
        obj['HardwareInformation.qwMemorySize'],
      );
      if (!isNaN(quadWordmemorySize)) {
        memorySizes[id] = quadWordmemorySize;
      }
    }
  }

  const rawBusNumbers: Record<string, string> = {};
  const rawBusAddresses: Record<string, string> = {};
  for (const data of output[1]) {
    const obj = parseFl(data);
    const id = matchDeviceId(obj['DeviceID']);
    const key = obj['KeyName'];
    const raw = parseInt(obj['Data']);

    if (id && key && !isNaN(raw)) {
      if (key === 'DEVPKEY_Device_BusNumber') {
        rawBusNumbers[id] = raw.toString(16);
      } else if (key === 'DEVPKEY_Device_Address') {
        const pciDevice = (raw >> 16) & 0xff;
        const pciFunction = raw & 0xff;
        rawBusAddresses[id] =
          `${pciDevice.toString(16)}.${pciFunction.toString(16)}`;
      }
    }
  }

  const gpus: GPUInfo[] = [];
  for (const data of output[0]) {
    if (!data.trim()) {
      continue;
    }

    const obj = parseFl(data);
    const id = matchDeviceId(obj['PNPDeviceID']);
    if (!id) {
      continue;
    }

    const rawBusNumber = rawBusNumbers[id];
    const rawBusAddress = rawBusAddresses[id];
    const busAddress =
      rawBusNumber && rawBusAddress
        ? normalizeBusAddress(`${rawBusNumber}:${rawBusAddress}`)
        : undefined;

    gpus.push({
      source: PROVIDER_ID,
      busAddress: busAddress,
      vendor: getVendor(obj['AdapterCompatibility']),
      name: obj['Name'],
      vram: memorySizes[id]
        ? memorySizes[id]
        : parseNumber(obj['AdapterRAM']) || 0,
    });
  }
  return gpus;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'win32';
  },
  async devices() {
    const workload = [];
    workload.push(powerShell('Get-CimInstance win32_VideoController | fl *'));
    workload.push(
      powerShell(
        "(Get-WmiObject -Class Win32_PnPEntity -Filter \"PNPDeviceID LIKE 'PCI%'\").GetDeviceProperties(@('DEVPKEY_Device_Address', 'DEVPKEY_Device_BusNumber')).deviceProperties | fl",
      ),
    );
    workload.push(
      powerShell(
        'gp "HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*" -ErrorAction SilentlyContinue | where MatchingDeviceId $null -NE | select MatchingDeviceId,HardwareInformation.qwMemorySize | fl',
      ),
    );

    const data = (await Promise.all(workload)).map(item =>
      item.replace(/\r/g, '').split(/\n\s*\n/),
    );
    return parseLines(data);
  },
};

export default provider;

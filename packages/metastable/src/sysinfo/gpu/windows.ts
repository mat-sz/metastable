import { GraphicsControllerData } from '../types.js';
import * as util from '../util.js';
import { nvidiaDevices } from './nvidia.js';

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
  if (!matchingDeviceId) {
    return undefined;
  }

  return {
    fullId: matchingDeviceId[0].toUpperCase(),
    vendorId: matchingDeviceId[1] || undefined,
    deviceId: matchingDeviceId[2] || undefined,
    subsystemId: matchingDeviceId[3] || undefined,
    revisionId: matchingDeviceId[4] || undefined,
  };
}

function parseLines(
  sections: string[],
  vections: string[],
): GraphicsControllerData[] {
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
            memorySizes[id.fullId] = quadWordmemorySize;
          }
        }
      }
    }
  }

  const controllers: GraphicsControllerData[] = [];
  for (const i in sections) {
    if ({}.hasOwnProperty.call(sections, i)) {
      if (sections[i].trim() !== '') {
        const lines = sections[i].trim().split('\n');
        const id = matchDeviceId(util.getValue(lines, 'PNPDeviceID', ':'));

        let subDeviceId: string | undefined = undefined;
        let memorySize: number | undefined = undefined;
        if (id) {
          subDeviceId = id.subsystemId;
          if (subDeviceId) {
            subDeviceId = subDeviceId.split('_')[1];
          }

          if (memorySizes[id.fullId]) {
            memorySize = memorySizes[id.fullId];
          }
        }

        controllers.push({
          vendor: util.getValue(lines, 'AdapterCompatibility', ':'),
          model: util.getValue(lines, 'name', ':'),
          bus: util.getValue(lines, 'PNPDeviceID', ':').startsWith('PCI')
            ? 'PCI'
            : undefined,
          vram:
            typeof memorySize !== 'number'
              ? util.toInt(util.getValue(lines, 'AdapterRAM', ':'))
              : memorySize,
          vramDynamic: util.getValue(lines, 'VideoMemoryType', ':') === '2',
          subDeviceId,
        });
      }
    }
  }
  return controllers;
}

function nvidiaCompareSubsystemId(windowsId?: string, nvidiaId?: string) {
  if (!windowsId || !nvidiaId) {
    return false;
  }

  const windowsSubDeviceId = windowsId.toLowerCase();
  const nvidiaSubDeviceIdParts = nvidiaId.toLowerCase().split('x');
  const nvidiaSubDeviceId = nvidiaSubDeviceIdParts.pop()!;
  return (
    windowsSubDeviceId.padStart(8, '0') === nvidiaSubDeviceId.padStart(8, '0')
  );
}

export async function gpuWindows() {
  try {
    const workload = [];
    workload.push(
      util.powerShell('Get-CimInstance win32_VideoController | fl *'),
    );
    workload.push(
      util.powerShell(
        'gp "HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*" -ErrorAction SilentlyContinue | where MatchingDeviceId $null -NE | select MatchingDeviceId,HardwareInformation.qwMemorySize | fl',
      ),
    );

    const nvidiaData = await nvidiaDevices();
    const data = await Promise.all(workload);

    const csections = data[0].replace(/\r/g, '').split(/\n\s*\n/);
    const vsections = data[1].replace(/\r/g, '').split(/\n\s*\n/);
    const controllers = parseLines(csections, vsections).map(controller => {
      if (controller.vendor?.toLowerCase() === 'nvidia') {
        const nvidiaController = nvidiaData.find(device => {
          return nvidiaCompareSubsystemId(
            controller.subDeviceId,
            device.subDeviceId,
          );
        });

        return { ...controller, ...nvidiaController };
      } else {
        return controller;
      }
    });

    return controllers;
  } catch {}

  return [];
}

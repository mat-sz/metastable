import os from 'os';

import { stdout } from '#helpers/spawn.js';
import { normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

async function parseLines(lines: string[]): Promise<GPUInfo[]> {
  const controllers: GPUInfo[] = [];
  let currentController: GPUInfo = {
    vram: 0,
    vramDynamic: false,
  };
  let isGraphicsController = false;

  function maybePush() {
    if (currentController.busAddress) {
      currentController.busAddress = normalizeBusAddress(
        currentController.busAddress,
      );
      controllers.push(currentController);
      currentController = {
        vram: 0,
        vramDynamic: false,
      };
    }
  }
  // PCI bus IDs
  let pciIDs: string[] = [];
  try {
    pciIDs = (
      await stdout('dmidecode', ['-t', '9'], {
        env: {
          LC_ALL: 'C',
        },
      })
    )
      .split('\n')
      .filter(line => line.includes('Bus Address: '));
    for (let i = 0; i < pciIDs.length; i++) {
      pciIDs[i] = pciIDs[i]
        .replace('Bus Address:', '')
        .replace('0000:', '')
        .trim();
    }
    pciIDs = pciIDs.filter(el => !!el);
  } catch {
    //
  }
  let i = 1;
  lines.forEach(line => {
    let subsystem = '';
    if (i < lines.length && lines[i]) {
      // get next line;
      subsystem = lines[i];
      if (subsystem.indexOf(':') > 0) {
        subsystem = subsystem.split(':')[1];
      }
    }
    if ('' !== line.trim()) {
      if (' ' !== line[0] && '\t' !== line[0]) {
        // first line of new entry
        const isExternal = pciIDs.indexOf(line.split(' ')[0]) >= 0;
        let vgapos = line.toLowerCase().indexOf(' vga ');
        const _3dcontrollerpos = line.toLowerCase().indexOf('3d controller');
        if (vgapos !== -1 || _3dcontrollerpos !== -1) {
          // VGA
          if (_3dcontrollerpos !== -1 && vgapos === -1) {
            vgapos = _3dcontrollerpos;
          }
          maybePush();

          const pciIDCandidate = line.split(' ')[0];
          if (/[\da-fA-F]{2}:[\da-fA-F]{2}\.[\da-fA-F]/.test(pciIDCandidate)) {
            currentController.busAddress = pciIDCandidate;
          }
          isGraphicsController = true;
          const endpos = line.search(/\[[0-9a-f]{4}:[0-9a-f]{4}]|$/);
          const parts = line.substring(vgapos, endpos - vgapos).split(':');
          currentController.busAddress = line.substring(0, vgapos).trim();
          if (parts.length > 1) {
            parts[1] = parts[1].trim();
            if (parts[1].toLowerCase().indexOf('corporation') >= 0) {
              currentController.vendor = parts[1]
                .substring(
                  0,
                  parts[1].toLowerCase().indexOf('corporation') + 11,
                )
                .trim();
              currentController.model = parts[1]
                .substring(
                  parts[1].toLowerCase().indexOf('corporation') + 11,
                  200,
                )
                .split('(')[0]
                .trim();
              currentController.bus =
                pciIDs.length > 0 && isExternal ? 'PCIe' : 'Onboard';
              currentController.vram = 0;
              currentController.vramDynamic = false;
            } else if (parts[1].toLowerCase().indexOf(' inc.') >= 0) {
              if ((parts[1].match(/]/g) || []).length > 1) {
                currentController.vendor = parts[1]
                  .substring(0, parts[1].toLowerCase().indexOf(']') + 1)
                  .trim();
                currentController.model = parts[1]
                  .substring(parts[1].toLowerCase().indexOf(']') + 1, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              } else {
                currentController.vendor = parts[1]
                  .substring(0, parts[1].toLowerCase().indexOf(' inc.') + 5)
                  .trim();
                currentController.model = parts[1]
                  .substring(parts[1].toLowerCase().indexOf(' inc.') + 5, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              }
              currentController.bus =
                pciIDs.length > 0 && isExternal ? 'PCIe' : 'Onboard';
              currentController.vram = 0;
              currentController.vramDynamic = false;
            } else if (parts[1].toLowerCase().indexOf(' ltd.') >= 0) {
              if ((parts[1].match(/]/g) || []).length > 1) {
                currentController.vendor = parts[1]
                  .substring(0, parts[1].toLowerCase().indexOf(']') + 1)
                  .trim();
                currentController.model = parts[1]
                  .substring(parts[1].toLowerCase().indexOf(']') + 1, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              } else {
                currentController.vendor = parts[1]
                  .substring(0, parts[1].toLowerCase().indexOf(' ltd.') + 5)
                  .trim();
                currentController.model = parts[1]
                  .substring(parts[1].toLowerCase().indexOf(' ltd.') + 5, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              }
            }
          }
        } else {
          isGraphicsController = false;
        }
      }
      if (isGraphicsController) {
        // within VGA details
        const parts = line.split(':');
        if (
          parts.length > 1 &&
          parts[0].replace(/ +/g, '').toLowerCase().indexOf('devicename') !==
            -1 &&
          parts[1].toLowerCase().indexOf('onboard') !== -1
        ) {
          currentController.bus = 'Onboard';
        }
        if (
          parts.length > 1 &&
          parts[0].replace(/ +/g, '').toLowerCase().indexOf('region') !== -1 &&
          parts[1].toLowerCase().indexOf('memory') !== -1
        ) {
          const memparts = parts[1].split('=');
          if (memparts.length > 1) {
            currentController.vram = parseInt(memparts[1]) * 1024 * 1024;
          }
        }
      }
    }
    i++;
  });

  maybePush();
  return controllers;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'linux';
  },
  async devices() {
    const lines = (await stdout('lspci', ['-vvv'])).split('\n');
    return await parseLines(lines);
  },
};

export default provider;

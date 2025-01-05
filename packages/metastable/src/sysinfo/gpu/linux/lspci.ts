import os from 'os';

import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'lspci';

async function parseLines(lines: string[]): Promise<GPUInfo[]> {
  const controllers: GPUInfo[] = [];
  let currentController: GPUInfo = {
    vendor: 'Unknown',
    source: PROVIDER_ID,
    vram: 0,
  };
  let isGraphicsController = false;

  function maybePush() {
    if (currentController.busAddress) {
      currentController.vendor = getVendor(currentController.vendor);
      currentController.busAddress = normalizeBusAddress(
        currentController.busAddress,
      );
      controllers.push(currentController);
      currentController = {
        vendor: 'Unknown',
        source: PROVIDER_ID,
        vram: 0,
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
        const idxVGA = line.toLowerCase().indexOf(' vga ');
        const idx3D = line.toLowerCase().indexOf('3d controller');
        if (idxVGA !== -1 || idx3D !== -1) {
          const idxStart = idx3D !== -1 && idxVGA === -1 ? idx3D : idxVGA;
          const idxEnd = line.search(/\[[0-9a-f]{4}:[0-9a-f]{4}]|$/);
          maybePush();

          const pciIDCandidate = line.split(' ')[0];
          if (/[\da-fA-F]{2}:[\da-fA-F]{2}\.[\da-fA-F]/.test(pciIDCandidate)) {
            currentController.busAddress = pciIDCandidate;
          }
          isGraphicsController = true;
          const parts = line.substring(idxStart, idxEnd - idxStart).split(':');
          currentController.busAddress = line.substring(0, idxStart).trim();
          if (parts.length > 1) {
            parts[1] = parts[1].trim();
            currentController.vendor = getVendor(parts[1]);
            currentController.name = parts[1];
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

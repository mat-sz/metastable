import { shell } from '../../helpers/spawn.js';
import { GraphicsControllerData } from '../types.js';
import { nvidiaDevices } from './nvidia.js';

async function parseLines(lines: string[]): Promise<GraphicsControllerData[]> {
  const controllers = [];
  let currentController: GraphicsControllerData = {
    vram: 0,
    vramDynamic: false,
  };
  let isGraphicsController = false;
  // PCI bus IDs
  let pciIDs: string[] = [];
  try {
    pciIDs = (
      await shell(
        'export LC_ALL=C; dmidecode -t 9 2>/dev/null; unset LC_ALL | grep "Bus Address: "',
      )
    )
      .toString()
      .split('\n');
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
          if (
            currentController.vendor ||
            currentController.model ||
            currentController.bus ||
            typeof currentController.vram !== 'undefined' ||
            currentController.vramDynamic
          ) {
            // already a controller found
            controllers.push(currentController);
            currentController = {
              vram: 0,
              vramDynamic: false,
            };
          }

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

  if (
    currentController.vendor ||
    currentController.model ||
    currentController.bus ||
    currentController.busAddress ||
    typeof currentController.vram !== 'undefined' ||
    currentController.vramDynamic
  ) {
    // already a controller found
    controllers.push(currentController);
  }
  return controllers;
}

function parseLinesLinuxClinfo(
  controllers: GraphicsControllerData[],
  lines: string[],
) {
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
        let controller = controllers.find(
          controller => controller.busAddress === busAddress,
        );
        if (!controller) {
          controller = {
            busAddress,
            vram: 0,
            vramDynamic: false,
          };
          controllers.push(controller);
        }
        controller.vendor = device['CL_DEVICE_VENDOR'];
        if (device['CL_DEVICE_BOARD_NAME_AMD']) {
          controller.model = device['CL_DEVICE_BOARD_NAME_AMD'];
        } else {
          controller.model = device['CL_DEVICE_NAME'];
        }
        const memory = parseInt(device['CL_DEVICE_GLOBAL_MEM_SIZE']);
        if (!isNaN(memory)) {
          controller.vram = memory;
        }
      }
    }
  }
  return controllers;
}

export async function gpuLinux() {
  let controllers: GraphicsControllerData[] = [];
  let nvidiaData: GraphicsControllerData[] = [];

  try {
    nvidiaData = await nvidiaDevices();
  } catch {}

  try {
    const stdout = await shell('lspci -vvv  2>/dev/null');
    const lines = stdout.toString().split('\n');
    controllers.push(...(await parseLines(lines)));
  } catch {}

  controllers = controllers.map(controller => {
    const nvidiaController = nvidiaData.find(nvidiaController =>
      nvidiaController
        .pciBus!.toLowerCase()
        .endsWith(controller.busAddress!.toLowerCase()),
    );

    return {
      ...controller,
      ...nvidiaController,
    };
  });

  // Container GPUs won't be present in controllers.
  for (const nvidiaController of nvidiaData) {
    if (
      !controllers.find(controller =>
        nvidiaController
          .pciBus!.toLowerCase()
          .endsWith(controller.busAddress!.toLowerCase()),
      )
    ) {
      controllers.push({
        vendor: 'NVIDIA',
        model: nvidiaController.name,
        ...nvidiaController,
      });
    }
  }

  try {
    const clinfoOut = await shell('clinfo --raw');
    const lines = clinfoOut.toString().split('\n');
    controllers = parseLinesLinuxClinfo(controllers, lines);
  } catch {}

  return controllers;
}

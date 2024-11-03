import os from 'os';

import { rocmUtilization } from './gpu/amd.js';
import { gpuLinux } from './gpu/linux.js';
import { nvidiaUtilization } from './gpu/nvidia.js';
import { gpuWindows } from './gpu/windows.js';
import {
  GraphicsControllerData,
  GraphicsControllerUtilization,
} from './types.js';

export async function gpu(): Promise<GraphicsControllerData[]> {
  let controllers: GraphicsControllerData[] = [];
  try {
    switch (os.platform()) {
      case 'win32':
        controllers = await gpuWindows();
        break;
      case 'linux':
        controllers = await gpuLinux();
        break;
      case 'darwin':
        controllers = [
          {
            vendor: 'Apple',
            vramDynamic: false,
            vram: os.totalmem(),
            memoryTotal: os.totalmem(),
          },
        ];
    }
  } catch {
    //
  }

  controllers = controllers.map(controller => {
    const normalized = controller.vendor?.toLowerCase();
    let vendor = 'unknown';

    if (normalized) {
      if (normalized.includes('apple')) {
        vendor = 'Apple';
      } else if (
        normalized.includes('advanced') ||
        normalized.includes('amd')
      ) {
        vendor = 'AMD';
      } else if (normalized.includes('nvidia')) {
        vendor = 'NVIDIA';
      } else {
        vendor = controller.vendor || 'unknown';
      }
    }

    return { ...controller, vendor };
  });

  return controllers;
}

export async function gpuUtilization() {
  const utilization: GraphicsControllerUtilization[] = [];
  try {
    utilization.push(...(await nvidiaUtilization()));
  } catch {}
  try {
    utilization.push(...(await rocmUtilization()));
  } catch {}

  if (utilization.length) {
    return utilization[0];
  }

  return undefined;
}

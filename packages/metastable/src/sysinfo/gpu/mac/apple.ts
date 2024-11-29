import os from 'os';

import { GPUInfoProvider } from '../types.js';

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'darwin';
  },
  async devices() {
    return [
      {
        vendor: 'Apple',
        vramDynamic: false,
        vram: os.totalmem(),
        memoryTotal: os.totalmem(),
      },
    ];
  },
};

export default provider;

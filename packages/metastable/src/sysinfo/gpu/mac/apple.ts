import os from 'os';

import { GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'apple';

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'darwin';
  },
  async devices() {
    return [
      {
        source: PROVIDER_ID,
        vendor: 'Apple',
        name: 'Integrated GPU',
        vram: os.totalmem(),
      },
    ];
  },
};

export default provider;

import { GPUInfoProvider } from '../types.js';
import nvidiaSmi from './nvidiaSmi.js';

export async function getProviders() {
  const providers: GPUInfoProvider[] = [];

  if (await nvidiaSmi.isAvailable()) {
    providers.push(nvidiaSmi);
  }

  return providers;
}

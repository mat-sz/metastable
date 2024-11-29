import { GPUInfoProvider } from '../types.js';
import rocmSmi from './rocmSmi.js';

export async function getProviders() {
  const providers: GPUInfoProvider[] = [];

  if (await rocmSmi.isAvailable()) {
    providers.push(rocmSmi);
  }

  return providers;
}

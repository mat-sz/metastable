import { GPUInfoProvider } from '../types.js';
import hipInfo from './hipInfo.js';
import rocmSmi from './rocmSmi.js';

export async function getProviders() {
  const providers: GPUInfoProvider[] = [];

  if (await rocmSmi.isAvailable()) {
    providers.push(rocmSmi);
  } else if (await hipInfo.isAvailable()) {
    providers.push(hipInfo);
  }

  return providers;
}

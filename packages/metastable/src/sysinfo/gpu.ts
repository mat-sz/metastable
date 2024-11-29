import { allResolved } from '#helpers/common.js';
import { getProviders } from './gpu/index.js';
import { GPUInfo } from './gpu/types.js';

export async function gpu(): Promise<GPUInfo[]> {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  return (await allResolved(providers.map(provider => provider.devices())))
    .filter(out => !!out)
    .flat();
}

export async function gpuUtilization() {
  const providers = await getProviders();
  if (!providers) {
    return undefined;
  }

  const utilization = (
    await allResolved(providers.map(provider => provider.utilization?.()))
  )
    .filter(out => !!out)
    .flat();

  if (utilization.length) {
    return utilization[0];
  }

  return undefined;
}

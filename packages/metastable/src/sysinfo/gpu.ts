import { allResolved } from '#helpers/common.js';
import { getProviders } from './gpu/index.js';
import { GPUInfo, GPUUtilization } from './gpu/types.js';

const EXTRA_WEIGHT = 100_000_000_000;

const PROVIDER_WEIGHT: Record<string, number> = {
  'nvidia-smi': 10 * EXTRA_WEIGHT,
  hipInfo: 5 * EXTRA_WEIGHT,
  'rocm-smi': 5 * EXTRA_WEIGHT,
};

function gpuValue(gpu: GPUInfo | GPUUtilization) {
  return (PROVIDER_WEIGHT[gpu.source] || 0) + (gpu.vram || 0);
}

function sortGpus<T extends GPUInfo[] | GPUUtilization[]>(
  gpus: (T | undefined)[],
): T {
  const flattened = gpus.filter(out => !!out).flat() as any as T;
  flattened.sort((a, b) => gpuValue(b) - gpuValue(a));
  return flattened;
}

export async function gpu(): Promise<GPUInfo[]> {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  const data = await allResolved(providers.map(provider => provider.devices()));
  return sortGpus(data);
}

export async function gpuUtilization() {
  const providers = await getProviders();
  if (!providers) {
    return undefined;
  }

  const utilization = await allResolved(
    providers.map(provider => provider.utilization?.()),
  );
  const sorted = sortGpus(utilization);

  if (sorted.length) {
    return sorted[0];
  }

  return undefined;
}

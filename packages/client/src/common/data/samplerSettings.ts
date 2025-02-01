import {
  ProjectQuality,
  ProjectSimpleSettings,
} from '@metastable/types/project';

export const qualitySamplerSettings: Record<
  ProjectQuality,
  Partial<ProjectSimpleSettings['sampler']> | undefined
> = {
  custom: undefined,
  low: {
    samplerName: 'dpmpp_2m_sde_gpu',
    schedulerName: 'karras',
    steps: 10,
  },
  medium: {
    samplerName: 'dpmpp_2m_sde_gpu',
    schedulerName: 'karras',
    steps: 30,
  },
  high: {
    samplerName: 'dpmpp_2m_sde_gpu',
    schedulerName: 'karras',
    steps: 60,
  },
  very_high: {
    samplerName: 'dpmpp_2m_sde_gpu',
    schedulerName: 'karras',
    steps: 100,
  },
};

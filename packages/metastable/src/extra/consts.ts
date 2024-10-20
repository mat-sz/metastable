import { ExtraFeature } from '@metastable/types';

export type ExtraFeatureWithoutState = Omit<
  ExtraFeature,
  'installed' | 'enabled'
>;

export const EXTRA_FEATURES: ExtraFeatureWithoutState[] = [
  {
    id: 'pulid',
    name: 'PuLID',
    pythonPackages: [
      { name: 'facexlib' },
      { name: 'insightface' },
      { name: 'onnxruntime' },
      { name: 'ftfy' },
      { name: 'timm' },
      { name: 'xformers' },
      { name: 'huggingface-hub' },
    ],
    namespace: 'pulid',
  },
];

export interface ExtraFeature {
  id: string;
  name: string;
  description?: string;
  pythonPackages?: { name: string; extra?: string }[];
  namespace?: string;
}

export const EXTRA_FEATURES: ExtraFeature[] = [
  {
    id: 'pulid',
    name: 'PuLID',
    pythonPackages: [
      { name: 'facexlib' },
      { name: 'insightface' },
      { name: 'onnxruntime' },
      { name: 'ftfy' },
      { name: 'timm' },
    ],
    namespace: 'pulid',
  },
];

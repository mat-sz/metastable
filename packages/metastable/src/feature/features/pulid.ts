import { FeaturePython } from '../base.js';

export class FeaturePulid extends FeaturePython {
  readonly id = 'pulid';
  readonly name = 'pulid';
  readonly pythonPackages = [
    { name: 'facexlib' },
    { name: 'insightface' },
    { name: 'onnxruntime' },
    { name: 'ftfy' },
    { name: 'timm' },
    { name: 'xformers' },
    { name: 'huggingface-hub' },
  ];
  readonly pythonNamespaceGroup = 'pulid';
}

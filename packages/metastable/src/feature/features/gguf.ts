import { FeaturePython } from '../base.js';

export class FeatureGGUF extends FeaturePython {
  readonly id = 'gguf';
  readonly name = 'GGUF';
  readonly description = 'GGUF model support.';
  readonly pythonPackages = [{ name: 'gguf' }];
  readonly tags = [];
}

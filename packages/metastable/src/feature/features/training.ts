import { FeaturePython } from '../base.js';

export class FeatureTraining extends FeaturePython {
  readonly id = 'training';
  readonly name = 'Training';
  readonly pythonPackages = [
    { name: 'opencv-python' },
    { name: 'huggingface-hub' },
    { name: 'tensorboard' },
    { name: 'pytorch-lightning' },
    { name: 'omegaconf' },
    { name: 'invisible-watermark' },
    { name: 'pooch' },
    { name: 'open-clip-torch' },
    { name: 'diffusers' },
    { name: 'dadaptation' },
    { name: 'lion-pytorch' },
    { name: 'prodigyopt' },
    { name: 'schedulefree' },
    { name: 'pytorch_optimizer' },
  ];
  readonly pythonNamespaceGroup = 'training';
}

import {
  FeatureProjectFields,
  FieldType,
  ModelType,
  ProjectType,
} from '@metastable/types';

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
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      pulid: {
        type: FieldType.CATEGORY,
        label: 'PuLID',
        enabledKey: 'enabled',
        properties: {
          name: {
            type: FieldType.MODEL,
            modelType: ModelType.IPADAPTER,
            label: 'Model',
          },
          strength: {
            type: FieldType.FLOAT,
            label: 'Strength',
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 1,
          },
          image: {
            type: FieldType.IMAGE,
            label: 'Image',
          },
        },
      },
    },
  };
}

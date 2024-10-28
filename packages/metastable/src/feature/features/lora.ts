import {
  FeatureProjectFields,
  FieldToType,
  FieldType,
  ModelType,
  ProjectType,
} from '@metastable/types';

import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

const loraField = {
  type: FieldType.ARRAY,
  label: 'LoRA',
  itemType: {
    type: FieldType.CATEGORY,
    label: 'LoRA',
    enabledKey: 'enabled',
    properties: {
      name: {
        type: FieldType.MODEL,
        modelType: ModelType.LORA,
        label: 'Model',
      },
      strength: {
        type: FieldType.FLOAT,
        label: 'Strength',
        min: -5,
        max: 5,
        step: 0.01,
        defaultValue: 1,
      },
    },
  },
} as const;

type LoraFieldType = FieldToType<typeof loraField>;

export class FeatureLora extends FeaturePython {
  readonly id = 'lora';
  readonly name = 'LoRA';
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      lora: loraField,
    },
  };

  async onBeforeConditioning(task: PromptTask) {
    const { settings, checkpoint, session } = task;
    const loras = settings.featureData?.lora as LoraFieldType;
    if (!loras?.length || !session || !checkpoint) {
      return;
    }

    if (loras?.length) {
      for (const loraSettings of loras) {
        if (loraSettings.enabled) {
          const lora = await session.lora.load((loraSettings as any).path!);
          await lora.applyTo(checkpoint, loraSettings.strength);
        }
      }
    }
  }
}

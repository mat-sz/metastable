import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

const field = {
  type: FieldType.ARRAY,
  label: 'Controlnet',
  itemType: {
    type: FieldType.CATEGORY,
    label: 'Controlnet',
    enabledKey: 'enabled',
    properties: {
      model: {
        type: FieldType.MODEL,
        modelType: ModelType.CONTROLNET,
        label: 'Model',
        shouldFilterByArchitecture: true,
      },
      strength: {
        type: FieldType.FLOAT,
        label: 'Strength',
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 1,
      },
      image: {
        type: FieldType.IMAGE,
        label: 'Image',
        modeKey: 'imageMode',
      },
    },
  },
} as const;

type FeatureFieldType = FieldToType<typeof field>;

export class FeatureControlnet extends FeaturePython {
  readonly id = 'controlnet';
  readonly name = 'Controlnet';
  readonly fields = {
    controlnet: field,
  };
  readonly tags = ['simple'];
  readonly pythonNamespaceGroup = 'controlnet';

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask)) {
      return;
    }

    task.after('conditioning', async () => {
      const { settings, checkpoint, session, conditioning } = task;
      const controlnets = settings.featureData?.controlnet as FeatureFieldType;
      if (!controlnets?.length || !session || !checkpoint || !conditioning) {
        return;
      }

      task.step('controlnet');
      for (const controlnetSettings of controlnets) {
        if (controlnetSettings.enabled) {
          const { image } = await task.loadInput(
            controlnetSettings.image!,
            (controlnetSettings as any).imageMode,
          );
          const controlnet = await session.api.controlnet.load({
            path: await Metastable.instance.resolve(controlnetSettings.model),
          });
          const { positive, negative } = await session.api.controlnet.apply({
            controlnet,
            positive: conditioning.positive,
            negative: conditioning.negative,
            image,
            strength: controlnetSettings.strength,
          });
          conditioning.positive = positive;
          conditioning.negative = negative;
        }
      }
    });
  }
}

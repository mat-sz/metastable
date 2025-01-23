import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

const field = {
  type: FieldType.ARRAY,
  label: 'IPAdapter',
  itemType: {
    type: FieldType.CATEGORY,
    label: 'IPAdapter',
    enabledKey: 'enabled',
    properties: {
      model: {
        type: FieldType.MODEL,
        modelType: ModelType.IPADAPTER,
        label: 'Model',
      },
      clipVision: {
        type: FieldType.MODEL,
        modelType: ModelType.CLIP_VISION,
        label: 'CLIPVision',
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
        modeKey: 'imageMode',
      },
    },
  },
} as const;

type FeatureFieldType = FieldToType<typeof field>;

export class FeatureIpAdapter extends FeaturePython {
  readonly id = 'ipadapter';
  readonly name = 'IPAdapter';
  readonly fields = {
    ipadapter: field,
  };
  readonly tags = ['simple'];
  readonly pythonNamespaceGroup = 'ipadapter';

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask)) {
      return;
    }

    task.after('conditioning', async () => {
      const { settings, checkpoint, session } = task;
      const ipadapters = settings.featureData?.ipadapter as FeatureFieldType;
      if (!ipadapters?.length || !session || !checkpoint) {
        return;
      }

      task.step('ipadapter');
      for (const ipadapterSettings of ipadapters) {
        if (ipadapterSettings.enabled) {
          const { image } = await task.loadInput(
            ipadapterSettings.image!,
            (ipadapterSettings as any).imageMode,
          );

          const ipadapter = await session.api.ipadapter.load({
            path: await Metastable.instance.resolve(ipadapterSettings.model),
          });
          const clipVision = await session.api.clipVision.load({
            path: await Metastable.instance.resolve(
              ipadapterSettings.clipVision!,
            ),
          });

          checkpoint.data.diffusionModel = await session.api.ipadapter.apply({
            ipadapter,
            clipVision,
            diffusionModel: checkpoint.data.diffusionModel,
            image,
            strength: ipadapterSettings.strength,
          });
        }
      }
    });
  }
}

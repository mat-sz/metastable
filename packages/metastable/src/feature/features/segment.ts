import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PostprocessTask } from '../../comfy/tasks/postprocess.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

const field = {
  type: FieldType.CATEGORY,
  label: 'Segment',
  enabledKey: 'enabled',
  properties: {
    model: {
      type: FieldType.MODEL,
      modelType: ModelType.SEGMENT_ANYTHING,
      label: 'Model',
    },
  },
} as const;

type FeatureFieldType = FieldToType<typeof field>;

export class FeatureSegment extends FeaturePython {
  readonly id = 'segment';
  readonly name = 'Segment Anything';
  readonly pythonNamespaceGroup = 'segment';
  readonly fields = {
    segment: field,
  };

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask) && !(task instanceof PostprocessTask)) {
      return;
    }

    (task as any).after('postprocess', async () => {
      const { settings, session, images } = task;
      const segmentSettings = settings.featureData?.segment as FeatureFieldType;
      if (!segmentSettings?.enabled || !session || !images) {
        return;
      }

      task.step('segment');
      const model = await session.api.segment.load({
        path: await Metastable.instance.resolve(segmentSettings.model),
      });
      task.images![0] = await await session.api.segment.segment({
        model,
        image: images[0],
      });
    });
  }
}

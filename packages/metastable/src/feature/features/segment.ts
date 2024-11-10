import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { ComfySession } from '../../comfy/session/index.js';
import { RPCRef } from '../../comfy/session/types.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PostprocessTask } from '../../comfy/tasks/postprocess.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfySegmentModel {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(image: RPCRef) {
    return (await this.session.invoke('segment:segment', {
      model: this.ref,
      image: image,
    })) as RPCRef;
  }
}

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

  private async load(session: ComfySession, mrn: string) {
    const data = (await session.invoke('segment:load', {
      path: await Metastable.instance.resolve(mrn),
    })) as RPCRef;
    return new ComfySegmentModel(session, data);
  }

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

      const model = await this.load(session, segmentSettings.model);
      task.images![0] = await model.applyTo(images[0]);
    });
  }
}

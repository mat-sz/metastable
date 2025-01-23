import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { RPCSession } from '../../comfy/rpc/session.js';
import { RPCRef } from '../../comfy/rpc/types.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PostprocessTask } from '../../comfy/tasks/postprocess.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyUpscaleModel {
  constructor(
    private session: RPCSession,
    private ref: RPCRef<'UpscaleModel'>,
  ) {}

  async applyTo(images: RPCRef<'ImageTensor'>[]) {
    return await this.session.api.upscaleModel.apply({
      upscaleModel: this.ref,
      images: images,
    });
  }
}

const field = {
  type: FieldType.CATEGORY,
  label: 'Upscale',
  enabledKey: 'enabled',
  properties: {
    model: {
      type: FieldType.MODEL,
      modelType: ModelType.UPSCALE_MODEL,
      label: 'Model',
    },
  },
} as const;

type FeatureFieldType = FieldToType<typeof field>;

export class FeatureUpscale extends FeaturePython {
  readonly id = 'upscale';
  readonly name = 'Upscale';
  readonly pythonPackages = [{ name: 'spandrel' }];
  readonly pythonNamespaceGroup = 'upscale';
  readonly tags = ['simple', 'postprocess'];
  readonly fields = {
    upscale: field,
  };

  private async load(session: RPCSession, mrn: string) {
    const data = await session.api.upscaleModel.load({
      path: await Metastable.instance.resolve(mrn),
    });
    return new ComfyUpscaleModel(session, data);
  }

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask) && !(task instanceof PostprocessTask)) {
      return;
    }

    (task as any).after('postprocess', async () => {
      const { settings, session, images } = task;
      const upscaleSettings = settings.featureData?.upscale as FeatureFieldType;
      if (!upscaleSettings?.enabled || !session || !images) {
        return;
      }

      task.step('upscale');
      const upscaleModel = await this.load(session, upscaleSettings.model);
      task.images = await upscaleModel.applyTo(images);
    });
  }
}

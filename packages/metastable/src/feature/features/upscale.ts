import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { ComfySession } from '../../comfy/session/index.js';
import { RPCRef } from '../../comfy/session/types.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PostprocessTask } from '../../comfy/tasks/postprocess.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyUpscaleModel {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(images: RPCRef[]) {
    return (await this.session.invoke('upscale_model:apply', {
      upscale_model: this.ref,
      images: images,
    })) as RPCRef[];
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
  readonly type = 'postprocess';
  readonly fields = {
    upscale: field,
  };

  private async load(session: ComfySession, mrn: string) {
    const data = (await session.invoke('upscale_model:load', {
      path: await Metastable.instance.resolve(mrn),
    })) as RPCRef;
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

      const upscaleModel = await this.load(session, upscaleSettings.model);
      task.images = await upscaleModel.applyTo(images);
    });
  }
}

import {
  FeatureProjectFields,
  FieldToType,
  FieldType,
  ModelType,
  ProjectType,
} from '@metastable/types';

import { ComfySession } from '../../comfy/session/index.js';
import { RPCRef } from '../../comfy/session/types.js';
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

const upscaleField = {
  type: FieldType.CATEGORY,
  label: 'Upscale',
  enabledKey: 'enabled',
  properties: {
    name: {
      type: FieldType.MODEL,
      modelType: ModelType.UPSCALE_MODEL,
      label: 'Model',
    },
  },
} as const;

type UpscaleFieldType = FieldToType<typeof upscaleField>;

export class FeatureUpscale extends FeaturePython {
  readonly id = 'upscale';
  readonly name = 'Upscale';
  readonly pythonPackages = [{ name: 'spandrel' }];
  readonly pythonNamespaceGroup = 'upscale';
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      upscale: upscaleField,
    },
  };

  private async load(session: ComfySession, path: string) {
    const data = (await session.invoke('upscale_model:load', {
      path,
    })) as RPCRef;
    return new ComfyUpscaleModel(session, data);
  }

  async onAfterSample(task: PromptTask) {
    const { settings, session, images } = task;
    const upscaleSettings = (settings as any).upscale as UpscaleFieldType;
    if (!upscaleSettings?.enabled || !session || !images) {
      return;
    }

    const upscaleModel = await this.load(
      session,
      (upscaleSettings as any).path!,
    );
    task.images = await upscaleModel.applyTo(images);
  }
}

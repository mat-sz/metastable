import {
  FeatureProjectFields,
  FieldToType,
  FieldType,
  ModelType,
  ProjectType,
} from '@metastable/types';

import { ComfySession } from '../../comfy/session/index.js';
import { ComfyCheckpoint } from '../../comfy/session/models.js';
import { RPCRef } from '../../comfy/session/types.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyLORA {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(checkpoint: ComfyCheckpoint, strength: number) {
    const { model, clip } = (await this.session.invoke('lora:apply', {
      lora: this.ref,
      model: checkpoint.data.model,
      clip: checkpoint.data.clip,
      strength,
    })) as { model: RPCRef; clip: RPCRef };
    checkpoint.data.model = model;
    checkpoint.data.clip = clip;
  }
}

const field = {
  type: FieldType.ARRAY,
  label: 'LoRA',
  itemType: {
    type: FieldType.CATEGORY,
    label: 'LoRA',
    enabledKey: 'enabled',
    properties: {
      model: {
        type: FieldType.MODEL,
        modelType: ModelType.LORA,
        label: 'Model',
        shouldFilterByArchitecture: true,
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

type FeatureFieldType = FieldToType<typeof field>;

export class FeatureLora extends FeaturePython {
  readonly id = 'lora';
  readonly name = 'LoRA';
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      lora: field,
    },
  };
  readonly pythonNamespaceGroup = 'lora';

  private async load(session: ComfySession, mrn: string) {
    const data = (await session.invoke('lora:load', {
      path: await this.metastable.resolve(mrn),
    })) as RPCRef;
    return new ComfyLORA(session, data);
  }

  async onBeforeConditioning(task: PromptTask) {
    const { settings, checkpoint, session } = task;
    const loras = settings.featureData?.lora as FeatureFieldType;
    if (!loras?.length || !session || !checkpoint) {
      return;
    }

    if (loras?.length) {
      for (const loraSettings of loras) {
        if (loraSettings.enabled) {
          const lora = await this.load(session, loraSettings.model);
          await lora.applyTo(checkpoint, loraSettings.strength);
        }
      }
    }
  }
}

import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { RPCSession } from '../../comfy/rpc/session.js';
import { RPCRef } from '../../comfy/rpc/types.js';
import { ComfyCheckpoint } from '../../comfy/session/models.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyLORA {
  constructor(
    private session: RPCSession,
    private ref: RPCRef<'LORA'>,
  ) {}

  async applyTo(checkpoint: ComfyCheckpoint, strength: number) {
    const { diffusion_model, text_encoder } = await this.session.api.lora.apply(
      {
        lora: this.ref,
        diffusionModel: checkpoint.data.diffusionModel,
        textEncoder: checkpoint.data.textEncoder,
        strength,
      },
    );
    checkpoint.data.diffusionModel = diffusion_model;
    checkpoint.data.textEncoder = text_encoder;
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
  readonly fields = {
    lora: field,
  };
  readonly tags = ['simple'];
  readonly pythonNamespaceGroup = 'lora';

  private async load(session: RPCSession, mrn: string) {
    const data = await session.api.lora.load({
      path: await Metastable.instance.resolve(mrn),
    });
    return new ComfyLORA(session, data);
  }

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask)) {
      return;
    }

    task.after('checkpoint', async () => {
      const { settings, checkpoint, session } = task;
      const loras = settings.featureData?.lora as FeatureFieldType;
      if (!loras?.length || !session || !checkpoint) {
        return;
      }

      task.step('lora');
      for (const loraSettings of loras) {
        if (loraSettings.enabled) {
          const lora = await this.load(session, loraSettings.model);
          await lora.applyTo(checkpoint, loraSettings.strength);
        }
      }
    });
  }
}

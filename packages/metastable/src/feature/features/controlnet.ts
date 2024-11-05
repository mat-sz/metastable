import {
  FeatureProjectFields,
  FieldToType,
  FieldType,
  ModelType,
  ProjectType,
} from '@metastable/types';

import { Metastable } from '#metastable';
import { ComfySession } from '../../comfy/session/index.js';
import { ComfyConditioning } from '../../comfy/session/models.js';
import { RPCRef } from '../../comfy/session/types.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyControlnet {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    conditioning: ComfyConditioning,
    image: RPCRef,
    strength: number,
  ) {
    const { positive, negative } = (await this.session.invoke(
      'controlnet:apply',
      {
        controlnet: this.ref,
        positive: conditioning.positive,
        negative: conditioning.negative,
        image,
        strength,
      },
    )) as { positive: RPCRef; negative: RPCRef };
    conditioning.positive = positive;
    conditioning.negative = negative;
  }
}

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
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      controlnet: field,
    },
  };
  readonly pythonNamespaceGroup = 'controlnet';

  private async load(session: ComfySession, mrn: string) {
    const data = (await session.invoke('controlnet:load', {
      path: await Metastable.instance.resolve(mrn),
    })) as RPCRef;
    return new ComfyControlnet(session, data);
  }

  async onAfterConditioning(task: PromptTask) {
    const { settings, checkpoint, session, conditioning } = task;
    const controlnets = settings.featureData?.controlnet as FeatureFieldType;
    if (!controlnets?.length || !session || !checkpoint || !conditioning) {
      return;
    }

    for (const controlnetSettings of controlnets) {
      if (controlnetSettings.enabled) {
        const { image } = await task.loadInput(
          controlnetSettings.image!,
          (controlnetSettings as any).imageMode,
        );
        const controlnet = await this.load(session, controlnetSettings.model);
        await controlnet.applyTo(
          conditioning,
          image,
          controlnetSettings.strength,
        );
      }
    }
  }
}

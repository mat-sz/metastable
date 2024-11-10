import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { ComfySession } from '../../comfy/session/index.js';
import {
  ComfyCheckpoint,
  ComfyCLIPVision,
} from '../../comfy/session/models.js';
import { RPCRef } from '../../comfy/session/types.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

export class ComfyIPAdapter {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    checkpoint: ComfyCheckpoint,
    clipVision: ComfyCLIPVision,
    image: RPCRef,
    strength: number,
  ) {
    const { model } = (await this.session.invoke('ipadapter:apply', {
      ipadapter: this.ref,
      clip_vision: clipVision.ref,
      model: checkpoint.data.model,
      image,
      strength,
    })) as { model: RPCRef };
    checkpoint.data.model = model;
  }
}

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

  private async load(session: ComfySession, mrn: string) {
    const data = (await session.invoke('ipadapter:load', {
      path: await Metastable.instance.resolve(mrn),
    })) as RPCRef;
    return new ComfyIPAdapter(session, data);
  }

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
          const ipadapter = await this.load(session, ipadapterSettings.model);
          const clipVision = await session.clipVision.load(
            await Metastable.instance.resolve(ipadapterSettings.clipVision!),
          );
          await ipadapter.applyTo(
            checkpoint,
            clipVision,
            image,
            ipadapterSettings.strength,
          );
        }
      }
    });
  }
}

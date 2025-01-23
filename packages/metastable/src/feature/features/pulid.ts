import { FieldToType, FieldType, ModelType } from '@metastable/types';

import { Metastable } from '#metastable';
import { RPCSession } from '../../comfy/rpc/session.js';
import { BaseComfyTask } from '../../comfy/tasks/base.js';
import { PromptTask } from '../../comfy/tasks/prompt.js';
import { FeaturePython } from '../base.js';

const field = {
  type: FieldType.CATEGORY,
  label: 'PuLID',
  enabledKey: 'enabled',
  properties: {
    model: {
      type: FieldType.MODEL,
      modelType: ModelType.IPADAPTER,
      label: 'Model',
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
    },
  },
} as const;

type FeatureFieldType = FieldToType<typeof field>;

export class FeaturePulid extends FeaturePython {
  readonly id = 'pulid';
  readonly name = 'PuLID';
  readonly pythonPackages = [
    { name: 'facexlib' },
    { name: 'insightface' },
    { name: 'onnxruntime' },
    { name: 'ftfy' },
    { name: 'timm' },
    { name: 'xformers' },
    { name: 'huggingface-hub' },
  ];
  readonly pythonNamespaceGroup = 'pulid';
  readonly tags = ['simple'];
  readonly fields = {
    pulid: field,
  };

  private async loadEvaClip(session: RPCSession) {
    return await session.api.pulid.loadEvaClip();
  }

  private async loadInsightface(session: RPCSession, root: string) {
    return await session.api.pulid.loadInsightface({
      root,
    });
  }

  async onTask(task: BaseComfyTask) {
    if (!(task instanceof PromptTask)) {
      return;
    }

    task.after('conditioning', async () => {
      const { settings, checkpoint, session } = task;
      const pulidSettings = settings.featureData?.pulid as FeatureFieldType;
      if (!pulidSettings?.enabled || !session || !checkpoint) {
        return;
      }

      task.step('pulid');
      const pulid = await session.api.pulid.load({
        path: await Metastable.instance.resolve(pulidSettings.model),
      });
      const faceAnalysis = await this.loadInsightface(
        session,
        Metastable.instance.internalPath,
      );
      const evaClip = await this.loadEvaClip(session);
      const { image } = await task.loadInputRaw(pulidSettings.image!);
      checkpoint.data.diffusionModel = await session.api.pulid.apply({
        diffusionModel: checkpoint.data.diffusionModel,
        pulid,
        evaClip,
        faceAnalysis,
        image,
        strength: pulidSettings.strength,
      });
    });
  }
}

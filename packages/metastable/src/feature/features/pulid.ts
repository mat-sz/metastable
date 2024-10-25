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

class ComfyPulid {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    checkpoint: ComfyCheckpoint,
    evaClip: RPCRef,
    faceAnalysis: RPCRef,
    image: RPCRef,
    strength: number,
  ) {
    const model = (await this.session.invoke('pulid:apply', {
      model: checkpoint.data.model,
      pulid: this.ref,
      eva_clip: evaClip,
      face_analysis: faceAnalysis,
      image,
      strength,
    })) as RPCRef;
    checkpoint.data.model = model;
  }
}

const pulidField = {
  type: FieldType.CATEGORY,
  label: 'PuLID',
  enabledKey: 'enabled',
  properties: {
    name: {
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

type PulidFieldType = FieldToType<typeof pulidField>;
export class FeaturePulid extends FeaturePython {
  readonly id = 'pulid';
  readonly name = 'pulid';
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
  readonly projectFields: FeatureProjectFields = {
    [ProjectType.SIMPLE]: {
      pulid: pulidField,
    },
  };

  private async load(session: ComfySession, path: string) {
    const data = (await session.invoke('pulid:load', {
      path,
    })) as RPCRef;
    return new ComfyPulid(session, data);
  }

  private async loadEvaClip(session: ComfySession) {
    return (await session.invoke('pulid:load_eva_clip')) as RPCRef;
  }

  private async loadInsightface(session: ComfySession, root: string) {
    return (await session.invoke('pulid:load_insightface', {
      root,
    })) as RPCRef;
  }

  async onAfterConditioning(task: PromptTask) {
    const { settings, checkpoint, session } = task;
    const pulidSettings = (settings as any).pulid as PulidFieldType;
    if (!pulidSettings?.enabled || !session || !checkpoint) {
      return;
    }

    const pulid = await this.load(session, (pulidSettings as any).path!);
    const insightface = await this.loadInsightface(
      session,
      this.metastable.internalPath,
    );
    const evaClip = await this.loadEvaClip(session);
    const { image } = await task.loadInputRaw(pulidSettings.image!);
    await pulid.applyTo(
      checkpoint,
      evaClip,
      insightface,
      image,
      pulidSettings.strength ?? 1,
    );
  }
}

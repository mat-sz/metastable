import fs from 'fs/promises';
import path from 'path';

import {
  mapProjectFields,
  MRN,
  preprocessPrompt,
  recurseFields,
  setDefaultValues,
} from '@metastable/common';
import {
  Architecture,
  Feature,
  FieldType,
  ImageFile,
  ModelType,
  ProjectImageMode,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  ProjectType,
  TaskState,
} from '@metastable/types';
import PNG from 'meta-png';
import sharp, { FitEnum } from 'sharp';

import { Metastable } from '#metastable';
import { ProjectEntity } from '../../data/project.js';
import { getNextFilename } from '../../helpers/fs.js';
import { SHARP_FIT_MAP } from '../../helpers/image.js';
import { applyStyleToPrompt } from '../../helpers/prompt.js';
import { BaseTask } from '../../tasks/task.js';
import { bufferToRpcBytes } from '../session/helpers.js';
import type { ComfySession } from '../session/index.js';
import { ComfyCheckpoint, ComfyConditioning } from '../session/models.js';
import { ComfyPreviewSettings, RPCRef } from '../session/types.js';

export class PromptTask extends BaseTask<ProjectPromptTaskData> {
  private embeddingsPath?: string;
  private preview: ComfyPreviewSettings = {
    method: 'auto',
  };
  private storeMetadata = false;
  public session?: ComfySession;
  public checkpoint?: ComfyCheckpoint;
  public conditioning?: ComfyConditioning;
  private checkpointConfigPath?: string;
  private features: Feature[] = [];
  public images?: RPCRef[];

  constructor(
    private project: ProjectEntity,
    public settings: ProjectSimpleSettings,
  ) {
    super('prompt', { projectId: project.id });
    this.created();
  }

  private async validateModel(
    type: ModelType,
    required: boolean,
    mrn?: string,
  ) {
    if (!mrn) {
      if (required) {
        throw new Error(`Missing ${type} model.`);
      } else {
        return;
      }
    }

    const parsed = MRN.parse(mrn);
    if (parsed.segments[0] !== 'model') {
      throw new Error(`Invalid MRN for model type ${type}: ${mrn}`);
    }

    await Metastable.instance.resolve(mrn);
  }

  async init() {
    this.features = await Metastable.instance.feature.all();
    const fields = mapProjectFields(this.features)[ProjectType.SIMPLE];
    setDefaultValues(this.settings.featureData, fields);

    const settings = this.settings;

    if (settings.input.type !== 'none' && !settings.input.image) {
      throw new Error("Image is required if input type is not 'none'.");
    }

    if (settings.checkpoint.mode === 'advanced') {
      await this.validateModel(ModelType.UNET, true, settings.checkpoint.unet);
      await this.validateModel(ModelType.CLIP, true, settings.checkpoint.clip1);
      await this.validateModel(
        ModelType.CLIP,
        false,
        settings.checkpoint.clip2,
      );
      await this.validateModel(ModelType.VAE, true, settings.checkpoint.vae);
    } else {
      await this.validateModel(
        ModelType.CHECKPOINT,
        true,
        settings.checkpoint.model,
      );
    }

    this.embeddingsPath = await Metastable.instance.model.getEmbeddingsPath();

    const config = await Metastable.instance.config.all();

    if (config.generation?.preview) {
      try {
        const decoderModel = await Metastable.instance.model.getByName(
          ModelType.VAE_APPROX,
          'taesd_decoder',
        );
        const decoderXlModel = await Metastable.instance.model.getByName(
          ModelType.VAE_APPROX,
          'taesdxl_decoder',
        );

        this.preview = {
          method: 'taesd',
          taesd: {
            taesd_decoder: decoderModel.path,
            taesdxl_decoder: decoderXlModel.path,
          },
        };
      } catch {}
    } else {
      this.preview = {
        method: 'none',
      };
    }

    if (config.generation?.imageMetadata) {
      this.storeMetadata = true;
    }

    if (settings.input.type !== 'image_masked') {
      settings.input.padEdges = undefined;
    }

    settings.sampler.tiling = !!settings.sampler.tiling;

    const promises: Promise<void>[] = [];

    recurseFields(settings.featureData, fields, (parent, key, field) => {
      if (field.type === FieldType.MODEL) {
        const fn = async () => {
          try {
            await this.validateModel(field.modelType, true, parent?.[key]);
          } catch {
            parent.enabled = false;
          }
        };

        promises.push(fn());
      }
    });

    await Promise.all(promises);

    return { projectId: this.project.id };
  }

  private stepStart: number | undefined;
  private stepName: string | undefined;

  private step(name: string, max?: number) {
    const stepTime = { ...this.data.stepTime };
    if (this.stepStart && this.stepName) {
      stepTime[this.stepName] = Date.now() - this.stepStart;
    }
    this.stepStart = Date.now();
    this.stepName = name;

    this.data = {
      ...this.data,
      step: name,
      stepValue: 0,
      stepMax: max,
      preview: undefined,
      stepTime,
    };
  }

  async getCheckpoint(ctx: ComfySession) {
    const data = this.settings.checkpoint;
    if (data.mode === 'advanced') {
      const clipPaths = [await Metastable.instance.resolve(data.clip1!)];
      if (data.clip2) {
        clipPaths.push(await Metastable.instance.resolve(data.clip2));
      }

      return await ctx.checkpoint.advanced({
        type: Architecture.FLUX1,
        unetPath: await Metastable.instance.resolve(data.unet!),
        clipPaths,
        vaePath: await Metastable.instance.resolve(data.vae!),
        embeddingsPath: this.embeddingsPath,
      });
    } else {
      return await ctx.checkpoint.load(
        await Metastable.instance.resolve(data.model!),
        this.embeddingsPath,
        data.clipSkip ? -1 * data.clipSkip : undefined,
        this.checkpointConfigPath,
      );
    }
  }

  cancel() {
    if (this.state === TaskState.RUNNING && this.session) {
      this.session.destroy();
    }

    this.state = TaskState.CANCELLING;
  }

  private async inputAsBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('data:')) {
      return Buffer.from(url.split(',')[1], 'base64');
    }

    if (url.startsWith('mrn:')) {
      return await fs.readFile(await Metastable.instance.resolve(url));
    }

    throw new Error('Unable to load input');
  }

  async loadInputRaw(url: string) {
    const buffer = await this.inputAsBuffer(url);

    return await this.session!.image.load(bufferToRpcBytes(buffer));
  }

  private async callFeatureHandlers(
    handler: 'onBeforeConditioning' | 'onAfterConditioning' | 'onAfterSample',
  ) {
    for (const feature of this.features) {
      if (!feature.enabled) {
        continue;
      }

      const instance = Metastable.instance.feature.features[feature.id];
      if (instance?.[handler]) {
        this.step(feature.id);
        await instance[handler](this);
      }
    }
  }

  private async prepareImage(url: string, fit?: keyof FitEnum) {
    const buffer = await this.inputAsBuffer(url);
    const image = sharp(buffer);

    const { padEdges } = this.settings.input;
    const { width, height } = this.settings.output;
    image.resize({
      width,
      height,
      fit,
    });

    if (padEdges) {
      image.extend({
        top: padEdges,
        bottom: padEdges,
        left: padEdges,
        right: padEdges,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

      image.resize({
        width,
        height,
        fit,
      });
    }

    return image;
  }

  async loadInput(url: string, mode?: ProjectImageMode, maskUrl?: string) {
    const fit = SHARP_FIT_MAP[mode!] || 'fill';
    const image = await this.prepareImage(url, fit);

    if (maskUrl) {
      const maskImage = await this.prepareImage(url, fit);
      image.composite([
        { input: await maskImage.png().toBuffer(), blend: 'dest-out' },
      ]);
    }

    return await this.session!.image.load(
      bufferToRpcBytes(await image.png().toBuffer()),
    );
  }

  private async generate() {
    await Metastable.instance.comfy!.session(async ctx => {
      this.session = ctx;

      ctx.on('progress', e => {
        this.progress = e.value / e.max;
        this.data = {
          ...this.data,
          stepValue: e.value,
          stepMax: e.max,
          preview: e.preview,
        };
      });

      this.step('checkpoint');
      const settings = this.settings;
      this.checkpoint = await this.getCheckpoint(ctx);

      await this.callFeatureHandlers('onBeforeConditioning');

      this.step('conditioning');
      const { style } = settings.prompt;
      let { positive, negative } = settings.prompt;

      positive = preprocessPrompt(positive);
      negative = preprocessPrompt(negative);

      if (style) {
        positive = applyStyleToPrompt(positive, style.positive);
        negative = applyStyleToPrompt(negative, style.negative);
      }

      this.conditioning = await this.checkpoint.conditioning(
        positive,
        negative,
      );

      await this.callFeatureHandlers('onAfterConditioning');

      const isCircular = !!settings.sampler.tiling;

      let latent = undefined;

      this.step('input');
      switch (settings.input.type) {
        case 'none':
          latent = await ctx.image.emptyLatent(
            settings.output.width,
            settings.output.height,
            settings.output.batchSize || 1,
            this.checkpoint.data.latent_type,
          );
          break;
        case 'image':
          {
            const { image } = await this.loadInput(
              settings.input.image!,
              settings.input.imageMode,
            );
            latent = await this.checkpoint.encode(image);
          }
          break;
        case 'image_masked':
          {
            const { image, mask } = await this.loadInput(
              settings.input.image!,
              settings.input.imageMode,
              settings.input.mask,
            );
            latent = await this.checkpoint.encode(image, mask);
          }
          break;
      }

      if (settings.input.type !== 'image') {
        settings.sampler.denoise = 1;
      }

      if (!latent) {
        return;
      }

      this.step('sample');
      const samples = await this.checkpoint.sample(
        latent,
        this.conditioning,
        {
          ...settings.sampler,
          isCircular,
        },
        this.preview,
      );
      this.images = await this.checkpoint.decode(samples, isCircular);
      const outputDir = this.project!.files.output.path;

      await this.callFeatureHandlers('onAfterSample');

      this.step('save');
      const ext = settings.output?.format || 'png';
      const outputs: ImageFile[] = [];

      for (const image of this.images) {
        const bytes = await ctx.image.dump(image, ext);
        let buffer: Uint8Array = Buffer.from(bytes.$bytes, 'base64');

        if (this.storeMetadata && ext === 'png') {
          buffer = buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          );
          buffer = PNG.addMetadata(
            buffer,
            'metastable',
            JSON.stringify(settings),
          );
        }

        const filename = await getNextFilename(outputDir, ext);
        await fs.writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project!.files.output.get(filename);
        await output.metadata.set(settings);
        outputs.push(await output.json());
      }

      this.data = {
        ...this.data,
        outputs,
      };
    });
  }

  async execute() {
    try {
      await this.generate();
    } catch (e) {
      if (this.state === TaskState.CANCELLING) {
        return TaskState.CANCELLED;
      }

      throw e;
    }

    return TaskState.SUCCESS;
  }
}

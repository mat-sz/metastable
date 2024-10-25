import fs from 'fs/promises';
import path from 'path';

import {
  mapProjectFields,
  preprocessPrompt,
  recurseFields,
} from '@metastable/common';
import {
  Architecture,
  Feature,
  FieldType,
  ModelType,
  ProjectImageFile,
  ProjectImageMode,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  ProjectType,
  TaskState,
} from '@metastable/types';
import PNG from 'meta-png';
import sharp, { FitEnum } from 'sharp';

import { ProjectEntity } from '../../data/project.js';
import { getNextFilename } from '../../helpers/fs.js';
import { SHARP_FIT_MAP } from '../../helpers/image.js';
import { applyStyleToPrompt } from '../../helpers/prompt.js';
import { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';
import { bufferToRpcBytes } from '../session/helpers.js';
import type { ComfySession } from '../session/index.js';
import { ComfyPreviewSettings } from '../session/types.js';

export class PromptTask extends BaseTask<ProjectPromptTaskData> {
  private embeddingsPath?: string;
  private preview: ComfyPreviewSettings = {
    method: 'auto',
  };
  private storeMetadata = false;
  private session?: ComfySession;
  private checkpointConfigPath?: string;
  private features: Feature[] = [];

  constructor(
    private metastable: Metastable,
    private project: ProjectEntity,
    private settings: ProjectSimpleSettings,
  ) {
    super('prompt', { projectId: project.id });
    this.created();
  }

  private async setModelPath(
    type: ModelType,
    modelSettings?: { name?: string; path?: string },
  ) {
    if (!modelSettings) {
      return;
    }

    if (modelSettings.name && !modelSettings.path) {
      const model = await this.metastable.model.get(type, modelSettings.name);
      modelSettings.path = model.path;

      if (type === ModelType.CHECKPOINT && model.configPath) {
        this.checkpointConfigPath = model.configPath;
      }
    }
  }

  private async setModelPathArray(
    type: ModelType,
    array:
      | { enabled: boolean; name?: string; path?: string; image?: string }[]
      | undefined,
    validateImage = false,
  ) {
    if (!array) {
      return;
    }

    await Promise.all(
      array.map(async modelSettings => {
        if (!modelSettings.enabled) {
          return;
        }

        if (validateImage && !modelSettings.image) {
          modelSettings.enabled = false;
          return;
        }

        await this.setModelPath(type, modelSettings);
      }),
    );
  }

  async init() {
    this.features = await this.metastable.feature.all();

    const settings = this.settings;

    if (settings.input.type !== 'none' && !settings.input.image) {
      throw new Error("Image is required if input type is not 'none'.");
    }

    if (settings.checkpoint.mode === 'advanced') {
      await this.setModelPath(ModelType.UNET, settings.checkpoint.unet);
      await this.setModelPath(ModelType.CLIP, settings.checkpoint.clip1);
      if (settings.checkpoint.clip2?.name) {
        await this.setModelPath(ModelType.CLIP, settings.checkpoint.clip2);
      }
      await this.setModelPath(ModelType.VAE, settings.checkpoint.vae);
    } else {
      await this.setModelPath(ModelType.CHECKPOINT, settings.checkpoint);
    }

    this.embeddingsPath = await this.metastable.model.getEmbeddingsPath();

    await this.setModelPathArray(ModelType.LORA, settings.models.lora);
    await this.setModelPathArray(
      ModelType.CONTROLNET,
      settings.models.controlnet,
      true,
    );

    await this.setModelPath(ModelType.UPSCALE_MODEL, settings.upscale);

    if (settings.models.ipadapter) {
      for (const modelSettings of settings.models.ipadapter) {
        if (
          !modelSettings.enabled ||
          !modelSettings.image ||
          !modelSettings.name ||
          !modelSettings.clipVisionName
        ) {
          modelSettings.enabled = false;
          continue;
        }

        if (!modelSettings.path) {
          const model = await this.metastable.model.get(
            ModelType.IPADAPTER,
            modelSettings.name,
          );
          modelSettings.path = model.path;
        }

        if (!modelSettings.clipVisionPath) {
          const model = await this.metastable.model.get(
            ModelType.CLIP_VISION,
            modelSettings.clipVisionName,
          );
          modelSettings.clipVisionPath = model.path;
        }
      }
    }

    const config = await this.metastable.config.all();

    if (config.generation?.preview) {
      try {
        const decoderModel = await this.metastable.model.get(
          ModelType.VAE_APPROX,
          'taesd_decoder',
        );
        const decoderXlModel = await this.metastable.model.get(
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
    const fields = mapProjectFields(this.features);

    recurseFields(
      settings,
      fields[ProjectType.SIMPLE],
      (parent, key, field) => {
        if (field.type === FieldType.MODEL) {
          const fn = async () => {
            if (!parent?.[key]) {
              throw new Error('Unable to find model.');
            }

            const model = await this.metastable.model.get(
              field.modelType,
              parent[key],
            );
            parent.path = model.path;
          };

          promises.push(fn());
        }
      },
    );

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

  private getCleanSettings() {
    const settings: ProjectSimpleSettings = JSON.parse(
      JSON.stringify(this.settings),
    );

    for (const key of Object.keys(settings.models)) {
      const array = (settings.models as any)[key] as {
        path?: string;
        clipVisionPath?: string;
      }[];

      for (const modelSettings of array) {
        delete modelSettings['path'];
        delete modelSettings['clipVisionPath'];
      }
    }

    return settings;
  }

  async checkpoint(ctx: ComfySession) {
    const data = this.settings.checkpoint;
    if (data.mode === 'advanced') {
      const clipPaths = [data.clip1.path!];
      if (data.clip2?.path) {
        clipPaths.push(data.clip2.path);
      }

      return await ctx.checkpoint.advanced({
        type: Architecture.FLUX1,
        unetPath: data.unet.path!,
        clipPaths,
        vaePath: data.vae.path!,
        embeddingsPath: this.embeddingsPath,
      });
    } else {
      return await ctx.checkpoint.load(
        data.path!,
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
      return await fs.readFile(await this.metastable.resolve(url));
    }

    throw new Error('Unable to load input');
  }

  private async loadInputRaw(url: string) {
    const buffer = await this.inputAsBuffer(url);

    return await this.session!.image.load(bufferToRpcBytes(buffer));
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

  private async loadInput(
    url: string,
    mode?: ProjectImageMode,
    maskUrl?: string,
  ) {
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
    await this.metastable.comfy!.session(async ctx => {
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
      const checkpoint = await this.checkpoint(ctx);

      const loras = settings.models.lora;
      if (loras?.length) {
        this.step('lora');
        for (const loraSettings of loras) {
          if (loraSettings.enabled) {
            const lora = await ctx.lora.load(loraSettings.path!);
            await lora.applyTo(checkpoint, loraSettings.strength);
          }
        }
      }

      this.step('conditioning');
      const { style } = settings.prompt;
      let { positive, negative } = settings.prompt;

      positive = preprocessPrompt(positive);
      negative = preprocessPrompt(negative);

      if (style) {
        positive = applyStyleToPrompt(positive, style.positive);
        negative = applyStyleToPrompt(negative, style.negative);
      }

      const conditioning = await checkpoint.conditioning(positive, negative);

      const controlnets = settings.models.controlnet;
      if (controlnets?.length) {
        this.step('controlnet');
        for (const controlnetSettings of controlnets) {
          if (controlnetSettings.enabled) {
            const { image } = await this.loadInput(
              controlnetSettings.image!,
              controlnetSettings.imageMode,
            );
            const controlnet = await ctx.controlnet.load(
              controlnetSettings.path!,
            );
            await controlnet.applyTo(
              conditioning,
              image,
              controlnetSettings.strength,
            );
          }
        }
      }

      const ipadapters = settings.models.ipadapter;
      if (ipadapters?.length) {
        this.step('ipadapter');
        for (const ipadapterSettings of ipadapters) {
          if (ipadapterSettings.enabled) {
            const { image } = await this.loadInput(
              ipadapterSettings.image!,
              ipadapterSettings.imageMode,
            );
            const ipadapter = await ctx.ipadapter.load(ipadapterSettings.path!);
            const clipVision = await ctx.clipVision.load(
              ipadapterSettings.clipVisionPath!,
            );
            await ipadapter.applyTo(
              checkpoint,
              clipVision,
              image,
              ipadapterSettings.strength,
            );
          }
        }
      }

      if (settings.pulid) {
        this.step('pulid');
        const pulid = await ctx.pulid.load(settings.pulid.path!);
        const insightface = await ctx.pulid.loadInsightface(
          path.join(this.metastable.internalPath),
        );
        const evaClip = await ctx.pulid.loadEvaClip();
        const { image } = await this.loadInputRaw(settings.pulid.image!);
        await pulid.applyTo(
          checkpoint,
          evaClip,
          insightface,
          image,
          settings.pulid.strength,
        );
      }

      const isCircular = !!settings.sampler.tiling;

      let latent = undefined;

      this.step('input');
      switch (settings.input.type) {
        case 'none':
          latent = await ctx.image.emptyLatent(
            settings.output.width,
            settings.output.height,
            settings.output.batchSize || 1,
            checkpoint.data.latent_type,
          );
          break;
        case 'image':
          {
            const { image } = await this.loadInput(
              settings.input.image!,
              settings.input.imageMode,
            );
            latent = await checkpoint.encode(image);
          }
          break;
        case 'image_masked':
          {
            const { image, mask } = await this.loadInput(
              settings.input.image!,
              settings.input.imageMode,
              settings.input.mask,
            );
            latent = await checkpoint.encode(image, mask);
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
      const samples = await checkpoint.sample(
        latent,
        conditioning,
        {
          ...settings.sampler,
          isCircular,
        },
        this.preview,
      );
      let images = await checkpoint.decode(samples, isCircular);
      const outputDir = this.project!.files.output.path;

      if (settings.upscale?.enabled) {
        this.step('upscale');
        const upscaleModel = await ctx.upscale.load(settings.upscale.path!);
        images = await upscaleModel.applyTo(images);
      }

      this.step('save');
      const ext = settings.output?.format || 'png';
      const outputs: ProjectImageFile[] = [];
      const cleanSettings = this.getCleanSettings();

      for (const image of images) {
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
            JSON.stringify(cleanSettings),
          );
        }

        const filename = await getNextFilename(outputDir, ext);
        await fs.writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project!.files.output.get(filename);
        await output.metadata.set(cleanSettings);
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

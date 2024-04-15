import { writeFile } from 'fs/promises';
import path from 'path';

import {
  ImageFile,
  ModelType,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  TaskState,
} from '@metastable/types';

import { ProjectEntity } from '../../data/project.js';
import { getNextNumber } from '../../helpers/fs.js';
import { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';
import { ComfyPreviewSettings } from '../types.js';

function toBase64(url: string) {
  return url.split(',')[1];
}

export class PromptTask extends BaseTask<ProjectPromptTaskData> {
  private embeddingsPath?: string;
  private preview?: ComfyPreviewSettings;

  constructor(
    private metastable: Metastable,
    private project: ProjectEntity,
    private settings: ProjectSimpleSettings,
  ) {
    super('prompt', { projectId: project.name });
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
    const settings = this.settings;

    if (settings.input.type !== 'none' && !settings.input.processedImage) {
      throw new Error("Image is required if input type is not 'none'.");
    }

    await this.setModelPath(ModelType.CHECKPOINT, settings.checkpoint);

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

    settings.sampler.tiling = !!settings.sampler.tiling;

    return { projectId: this.project.name };
  }

  private step(name: string, max?: number) {
    this.data = {
      ...this.data,
      step: name,
      stepValue: 0,
      stepMax: max,
      preview: undefined,
    };
  }

  async execute() {
    await this.metastable.comfy!.session(async ctx => {
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
      const checkpoint = await ctx.checkpoint(
        settings.checkpoint.path!,
        this.embeddingsPath,
        settings.checkpoint.clipSkip
          ? -1 * settings.checkpoint.clipSkip
          : undefined,
      );

      const loras = settings.models.lora;
      if (loras?.length) {
        this.step('lora');
        for (const loraSettings of loras) {
          if (loraSettings.enabled) {
            const lora = await ctx.lora(loraSettings.path!);
            await lora.applyTo(checkpoint, loraSettings.strength);
          }
        }
      }

      this.step('conditioning');
      const conditioning = await checkpoint.conditioning(
        settings.prompt.positive,
        settings.prompt.negative,
      );

      const controlnets = settings.models.controlnet;
      if (controlnets?.length) {
        this.step('controlnet');
        for (const controlnetSettings of controlnets) {
          if (controlnetSettings.enabled) {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(controlnetSettings.image!),
            });
            const controlnet = await ctx.controlnet(controlnetSettings.path!);
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
            const { image } = await ctx.loadImage({
              $bytes: toBase64(ipadapterSettings.image!),
            });
            const ipadapter = await ctx.ipadapter(ipadapterSettings.path!);
            const clipVision = await ctx.clipVision(
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

      const isCircular = !!settings.sampler.tiling;

      let latent = undefined;

      this.step('input');
      switch (settings.input.type) {
        case 'none':
          latent = await ctx.emptyLatent(
            settings.output.width,
            settings.output.height,
            settings.output.batchSize || 1,
          );
          break;
        case 'image':
          {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(settings.input.processedImage!),
            });
            latent = await checkpoint.encode(image);
          }
          break;
        case 'image_masked':
          {
            const { image, mask } = await ctx.loadImage({
              $bytes: toBase64(settings.input.processedImage!),
            });
            latent = await checkpoint.encode(image, mask);
          }
          break;
      }

      if (!latent) {
        return;
      }

      this.step('sample');
      const samples = await checkpoint.sample(latent, conditioning, {
        ...settings.sampler,
        isCircular,
      });
      let images = await checkpoint.decode(samples, isCircular);
      const outputDir = this.project!.output.path;

      if (settings.upscale?.enabled) {
        this.step('upscale');
        const upscaleModel = await ctx.upscaleModel(settings.upscale.path!);
        images = await upscaleModel.applyTo(images);
      }

      this.step('save');
      let counter = await getNextNumber(outputDir);
      const ext = settings.output?.format || 'png';
      const outputs: ImageFile[] = [];
      for (const image of images) {
        const bytes = await ctx.dumpImage(image, ext);
        const buffer = Buffer.from(bytes.$bytes, 'base64');
        const filename = `${counter.toLocaleString('en-US', {
          minimumIntegerDigits: 5,
          useGrouping: false,
        })}.${ext}`;
        await writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project!.output.get(filename);
        await output.metadata.set(settings);
        outputs.push(await output.json());
        counter++;
      }

      this.data = {
        ...this.data,
        outputs,
      };
    });

    return TaskState.SUCCESS;
  }
}

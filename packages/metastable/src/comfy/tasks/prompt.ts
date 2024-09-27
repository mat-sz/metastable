import { writeFile } from 'fs/promises';
import path from 'path';

import {
  CheckpointType,
  ImageFile,
  ModelType,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  TaskState,
} from '@metastable/types';
import PNG from 'meta-png';

import { ProjectEntity } from '../../data/project.js';
import { getNextNumber } from '../../helpers/fs.js';
import { applyStyleToPrompt } from '../../helpers/prompt.js';
import { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';
import type { ComfySession } from '../session.js';
import { ComfyPreviewSettings, RPCBytes } from '../types.js';

export class PromptTask extends BaseTask<ProjectPromptTaskData> {
  private embeddingsPath?: string;
  private preview: ComfyPreviewSettings = {
    method: 'auto',
  };
  private storeMetadata = false;
  private session?: ComfySession;

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

    settings.sampler.tiling = !!settings.sampler.tiling;

    return { projectId: this.project.name };
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
        image?: string;
      }[];

      for (const modelSettings of array) {
        delete modelSettings['path'];
        delete modelSettings['clipVisionPath'];
        delete modelSettings['image'];
      }
    }

    delete settings['input']['image'];
    delete settings['input']['mask'];
    delete settings['input']['processedImage'];

    return settings;
  }

  async checkpoint(ctx: ComfySession) {
    const data = this.settings.checkpoint;
    if (data.mode === 'advanced') {
      const clipPaths = [data.clip1.path!];
      if (data.clip2?.path) {
        clipPaths.push(data.clip2.path);
      }

      return await ctx.checkpointAdvanced({
        type: CheckpointType.FLUX1,
        unetPath: data.unet.path!,
        clipPaths,
        vaePath: data.vae.path!,
        embeddingsPath: this.embeddingsPath,
      });
    } else {
      return await ctx.checkpoint(
        data.path!,
        this.embeddingsPath,
        data.clipSkip ? -1 * data.clipSkip : undefined,
      );
    }
  }

  cancel() {
    if (this.state === TaskState.RUNNING && this.session) {
      this.session.destroy();
    }

    this.state = TaskState.CANCELLING;
  }

  async inputAsBytes(url: string): Promise<RPCBytes> {
    if (url.startsWith('data:')) {
      return {
        $bytes: url.split(',')[1],
      };
    }

    throw new Error('Unable to load input');
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
            const lora = await ctx.lora(loraSettings.path!);
            await lora.applyTo(checkpoint, loraSettings.strength);
          }
        }
      }

      this.step('conditioning');
      const { style } = settings.prompt;
      let { positive, negative } = settings.prompt;

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
            const { image } = await ctx.loadImage(
              await this.inputAsBytes(controlnetSettings.image!),
            );
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
            const { image } = await ctx.loadImage(
              await this.inputAsBytes(ipadapterSettings.image!),
            );
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
            checkpoint.data.latent_type,
          );
          break;
        case 'image':
          {
            const { image } = await ctx.loadImage(
              await this.inputAsBytes(settings.input.processedImage!),
            );
            latent = await checkpoint.encode(image);
          }
          break;
        case 'image_masked':
          {
            const { image, mask } = await ctx.loadImage(
              await this.inputAsBytes(settings.input.processedImage!),
            );
            latent = await checkpoint.encode(image, mask);
          }
          break;
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
      const cleanSettings = this.getCleanSettings();

      for (const image of images) {
        const bytes = await ctx.dumpImage(image, ext);
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

        const filename = `${counter.toLocaleString('en-US', {
          minimumIntegerDigits: 5,
          useGrouping: false,
        })}.${ext}`;
        await writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project!.output.get(filename);
        await output.metadata.set(cleanSettings);
        outputs.push(await output.json());
        counter++;
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

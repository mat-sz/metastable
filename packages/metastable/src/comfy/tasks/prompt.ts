import { writeFile } from 'fs/promises';
import path from 'path';

import {
  ImageFile,
  ModelType,
  ProjectPromptTaskData,
  ProjectSettings,
  TaskState,
} from '@metastable/types';

import { ProjectEntity } from '../../data/project.js';
import { getNextNumber } from '../../helpers/fs.js';
import { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';

function toBase64(url: string) {
  return url.split(',')[1];
}

export class PromptTask extends BaseTask<ProjectPromptTaskData> {
  constructor(
    private metastable: Metastable,
    private project: ProjectEntity,
    private settings: ProjectSettings,
  ) {
    super('prompt', { projectId: project.name });
    this.created();
  }

  async init() {
    const settings = this.settings;

    if (!settings.models.base.path) {
      const model = await this.metastable.model.get(
        ModelType.CHECKPOINT,
        settings.models.base.name,
      );
      settings.models.base.path = model.path;
    }

    const embeddingsPath = await this.metastable.model.getEmbeddingsPath();
    if (embeddingsPath) {
      settings.models.base.embeddings_path = embeddingsPath;
    }

    if (settings.models.loras) {
      settings.models.loras = settings.models.loras.filter(
        model => model.enabled && model.name,
      );

      for (const modelSettings of settings.models.loras) {
        if (!modelSettings.path) {
          const model = await this.metastable.model.get(
            ModelType.LORA,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }
      }
    }

    if (settings.models.controlnets) {
      settings.models.controlnets = settings.models.controlnets.filter(
        model => model.enabled && model.name && model.image,
      );

      for (const modelSettings of settings.models.controlnets) {
        if (!modelSettings.path) {
          const model = await this.metastable.model.get(
            ModelType.CONTROLNET,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }
      }
    }

    if (settings.models.upscale?.name && settings.models.upscale?.enabled) {
      if (!settings.models.upscale.path) {
        const model = await this.metastable.model.get(
          ModelType.UPSCALE_MODEL,
          settings.models.upscale.name,
        );
        settings.models.upscale.path = model.path;
      }
    } else {
      settings.models.upscale = undefined;
    }

    if (settings.models.ipadapters) {
      settings.models.ipadapters = settings.models.ipadapters
        .filter(
          model =>
            model.enabled &&
            model.name &&
            model.clip_vision_name &&
            model.image,
        )
        .map(model => ({
          ...model,
          path:
            model.path ||
            this.metastable.model.getEntityPath(
              ModelType.IPADAPTER,
              model.name!,
            ),
          clip_vision_path:
            model.path ||
            this.metastable.model.getEntityPath(
              ModelType.CLIP_VISION,
              model.clip_vision_name!,
            ),
        }));

      for (const modelSettings of settings.models.ipadapters) {
        if (!modelSettings.path) {
          const model = await this.metastable.model.get(
            ModelType.IPADAPTER,
            modelSettings.name!,
          );
          modelSettings.path = model.path;
        }

        if (!modelSettings.clip_vision_path) {
          const model = await this.metastable.model.get(
            ModelType.CLIP_VISION,
            modelSettings.clip_vision_name!,
          );
          modelSettings.clip_vision_path = model.path;
        }
      }
    }

    if (settings.sampler.preview?.method === 'taesd') {
      const decoderModel = await this.metastable.model.get(
        ModelType.VAE_APPROX,
        'taesd_decoder',
      );
      const decoderXlModel = await this.metastable.model.get(
        ModelType.VAE_APPROX,
        'taesdxl_decoder',
      );
      settings.sampler.preview.taesd = {
        taesd_decoder: decoderModel.path,
        taesdxl_decoder: decoderXlModel.path,
      };
    }

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
        settings.models.base.path!,
        settings.models.base.embeddings_path,
        settings.models.base.clip_skip
          ? -1 * settings.models.base.clip_skip
          : undefined,
      );

      const loras = settings.models.loras;
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
        settings.conditioning.positive,
        settings.conditioning.negative,
      );

      const controlnets = settings.models.controlnets;
      if (controlnets?.length) {
        this.step('controlnet');
        for (const controlnetSettings of controlnets) {
          if (controlnetSettings.enabled) {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(controlnetSettings.image),
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

      const ipadapters = settings.models.ipadapters;
      if (ipadapters?.length) {
        this.step('ipadapter');
        for (const ipadapterSettings of ipadapters) {
          if (ipadapterSettings.enabled) {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(ipadapterSettings.image!),
            });
            const ipadapter = await ctx.ipadapter(ipadapterSettings.path!);
            const clipVision = await ctx.clipVision(
              ipadapterSettings.clip_vision_path!,
            );
            await ipadapter.applyTo(
              checkpoint,
              clipVision,
              image,
              ipadapterSettings.weight,
            );
          }
        }
      }

      const isCircular = !!settings.sampler.tiling;

      let latent = undefined;

      this.step('input');
      switch (settings.input.mode) {
        case 'empty':
          latent = await ctx.emptyLatent(
            settings.input.width,
            settings.input.height,
            settings.input.batch_size,
          );
          break;
        case 'image':
          {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(settings.input.image),
            });
            latent = await checkpoint.encode(image);
          }
          break;
        case 'image_masked':
          {
            const { image, mask } = await ctx.loadImage({
              $bytes: toBase64(settings.input.image),
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
        samplerName: settings.sampler.sampler,
        schedulerName: settings.sampler.scheduler,
        isCircular,
      });
      let images = await checkpoint.decode(samples, isCircular);
      const outputDir = this.project!.output.path;

      if (settings.models.upscale?.enabled) {
        this.step('upscale');
        const upscaleModel = await ctx.upscaleModel(
          settings.models.upscale!.path!,
        );
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

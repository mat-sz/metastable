import { writeFile } from 'fs/promises';
import path from 'path';

import { ModelType, ProjectSettings, TaskState } from '@metastable/types';

import { ProjectEntity } from '../data/project.js';
import { getNextNumber } from '../helpers/fs.js';
import { Metastable } from '../index.js';
import { BaseTask } from '../tasks/task.js';

function toBase64(url: string) {
  return url.split(',')[1];
}

export class PromptTask extends BaseTask {
  constructor(
    private metastable: Metastable,
    private project: ProjectEntity,
    private settings: ProjectSettings,
  ) {
    super('prompt', {});
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
  }

  async execute() {
    await this.metastable.comfy!.session(async ctx => {
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
        for (const lora of loras) {
          if (lora.enabled) {
            await checkpoint.applyLora(lora.path!, lora.strength);
          }
        }
      }

      let conditioning = await checkpoint.conditioning(
        settings.conditioning.positive,
        settings.conditioning.negative,
      );

      const controlnets = settings.models.controlnets;
      if (controlnets?.length) {
        for (const controlnet of controlnets) {
          if (controlnet.enabled) {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(controlnet.image),
            });
            conditioning = await checkpoint.applyControlnet(
              conditioning,
              controlnet.path!,
              image,
              controlnet.strength,
            );
          }
        }
      }

      const ipadapters = settings.models.ipadapters;
      if (ipadapters?.length) {
        for (const ipadapter of ipadapters) {
          if (ipadapter.enabled) {
            const { image } = await ctx.loadImage({
              $bytes: toBase64(ipadapter.image!),
            });
            await checkpoint.applyIpadapter(
              ipadapter.path!,
              ipadapter.clip_vision_path!,
              image,
              ipadapter.weight,
            );
          }
        }
      }

      const isCircular = !!settings.sampler.tiling;

      let latent = undefined;

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

      const samples = await checkpoint.sample(latent, conditioning, {
        ...settings.sampler,
        samplerName: settings.sampler.sampler,
        schedulerName: settings.sampler.scheduler,
        isCircular,
      });
      let images = await checkpoint.decode(samples, isCircular);
      const outputDir = this.project!.output.path;

      if (settings.models.upscale?.enabled) {
        images = await ctx.upscaleImages(settings.models.upscale.path!, images);
      }

      let counter = await getNextNumber(outputDir);
      for (const image of images) {
        const bytes = await ctx.dumpImage(image);
        const buffer = Buffer.from(bytes.$bytes, 'base64');
        const filename = `${counter.toLocaleString('en-US', {
          minimumIntegerDigits: 5,
          useGrouping: false,
        })}.png`;
        await writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project!.output.get(filename);
        await output.metadata.set(settings);
        counter++;
      }
    });

    return TaskState.SUCCESS;
  }
}

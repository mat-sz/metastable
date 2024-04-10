import { writeFile } from 'fs/promises';
import path from 'path';

import { ProjectSettings, TaskState } from '@metastable/types';

import { Comfy } from './index.js';
import { ProjectEntity } from '../data/project.js';
import { getNextNumber } from '../helpers/fs.js';
import { BaseTask } from '../tasks/task.js';

function toBase64(url: string) {
  return url.split(',')[1];
}

export class PromptTask extends BaseTask {
  constructor(
    private comfy: Comfy,
    private settings: ProjectSettings,
    private project: ProjectEntity,
  ) {
    super('prompt', {});
  }

  async execute() {
    await this.comfy.session(async ctx => {
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
            const image = await ctx.loadImage({
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
            const image = await ctx.loadImage({
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

      const latent = await ctx.emptyLatent(512, 512);
      const samples = await checkpoint.sample(
        latent,
        conditioning,
        settings.sampler.sampler,
        settings.sampler.scheduler,
        settings.sampler.steps,
        settings.sampler.denoise,
        settings.sampler.cfg,
        settings.sampler.seed,
      );
      const images = await checkpoint.decode(samples);
      const outputDir = this.project.output.path;
      let counter = await getNextNumber(outputDir);
      for (const image of images) {
        const bytes = await ctx.dumpImage(image);
        const buffer = Buffer.from(bytes.$bytes, 'base64');
        const filename = `${counter.toLocaleString('en-US', {
          minimumIntegerDigits: 5,
          useGrouping: false,
        })}.png`;
        await writeFile(path.join(outputDir, filename), buffer);
        const output = await this.project.output.get(filename);
        await output.metadata.set(settings);
        counter++;
      }
    });

    return TaskState.SUCCESS;
  }
}

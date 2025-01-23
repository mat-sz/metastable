import fs from 'fs/promises';
import path from 'path';

import { preprocessPrompt } from '@metastable/common';
import {
  Architecture,
  ImageFile,
  ModelDetails,
  ModelInputType,
  ModelType,
  ProjectImageMode,
  ProjectSimpleSettings,
} from '@metastable/types';
import PNG from 'meta-png';
import sharp, { FitEnum } from 'sharp';
import apng from 'sharp-apng';

import { Metastable } from '#metastable';
import { BaseComfyTask, BaseComfyTaskHandlers } from './base.js';
import { ProjectEntity } from '../../data/project.js';
import { getNextFilename } from '../../helpers/fs.js';
import { SHARP_FIT_MAP } from '../../helpers/image.js';
import { applyStyleToPrompt } from '../../helpers/prompt.js';
import { RPCRef } from '../rpc/types.js';
import { loadCheckpoint } from '../session/index.js';
import {
  ComfyCheckpoint,
  ComfyConditioning,
  ComfyLatent,
} from '../session/models.js';
import {
  ComfyCheckpointPaths,
  ComfyPreviewSettings,
} from '../session/types.js';

type PromptTaskHandlers = BaseComfyTaskHandlers & {
  postprocess: () => Promise<void> | void;
  conditioning: () => Promise<void> | void;
  checkpoint: () => Promise<void> | void;
};

export class PromptTask extends BaseComfyTask<
  PromptTaskHandlers,
  ProjectSimpleSettings
> {
  private details?: ModelDetails;
  private embeddingsPath?: string;
  public preview: ComfyPreviewSettings = {
    method: 'auto',
  };
  private storeMetadata = false;
  public latent?: ComfyLatent;
  public checkpoint?: ComfyCheckpoint;
  public conditioning?: ComfyConditioning;
  public images?: RPCRef<'ImageTensor'>[];
  public isCircular = false;

  constructor(project: ProjectEntity, settings: ProjectSimpleSettings) {
    super('prompt', project, settings);
  }

  async init() {
    const settings = this.settings;

    if (settings.input.type !== ModelInputType.NONE && !settings.input.image) {
      throw new Error("Image is required if input type is not 'none'.");
    }

    if (settings.models.mode === 'simple') {
      await this.validateModel(
        ModelType.CHECKPOINT,
        true,
        settings.models.checkpoint,
      );
    }

    this.embeddingsPath = await Metastable.instance.model.getEmbeddingsPath();

    const config = await Metastable.instance.config.all();

    if (!config.generation?.preview) {
      this.preview = {
        method: 'none',
      };
    }

    if (config.generation?.imageMetadata) {
      this.storeMetadata = true;
    }

    if (settings.input.type !== ModelInputType.IMAGE_MASKED) {
      settings.input.padEdges = undefined;
    }

    settings.sampler.tiling = !!settings.sampler.tiling;

    const baseData = await super.init();
    return {
      ...baseData,
      width: settings.output.width,
      height: settings.output.height,
    };
  }

  async getCheckpoint() {
    let data = this.settings.models;

    if (data.mode === 'simple') {
      // Ignore other selections in simple mode.
      data = {
        mode: 'simple',
        checkpoint: data.checkpoint,
      };
    } else if (data.mode === 'advanced') {
      data = {
        ...data,
        checkpoint: undefined,
      };
    }

    const mainMrn = data.diffusionModel || data.checkpoint;
    if (!mainMrn) {
      throw new Error(
        'Checkpoint loading error: missing diffusion model/checkpoint',
      );
    }

    const mainModel = await Metastable.instance.model.get(mainMrn);
    this.details = mainModel.details || {
      architecture: Architecture.SD1,
    };

    if (mainModel.isMetamodel) {
      const { textEncoders, diffusionModel, vae } = data;
      data = {
        mode: 'advanced',
        checkpoint: undefined,
        ...mainModel.metamodel?.json?.models,
      };

      if (textEncoders?.length) {
        data.textEncoders = textEncoders;
      }

      if (diffusionModel) {
        data.diffusionModel = diffusionModel;
      }

      if (vae) {
        data.vae = vae;
      }
    }

    const paths: ComfyCheckpointPaths = {
      vae: await Metastable.instance.tryResolve(data.vae),
      embeddings: this.embeddingsPath,
      config: mainModel.configPath,
    };

    if (data.diffusionModel) {
      const diffusionModel = await Metastable.instance.model.get(
        data.diffusionModel,
      );
      if (diffusionModel.type === ModelType.DIFFUSION_MODEL) {
        paths.diffusionModel = diffusionModel.path;
      } else if (diffusionModel.type === ModelType.CHECKPOINT) {
        paths.checkpoint = diffusionModel.path;
      }
    } else if (data.checkpoint) {
      paths.checkpoint = await Metastable.instance.tryResolve(data.checkpoint);
    }

    const textEncoderMrns = data.textEncoders?.filter(mrn => !!mrn) || [];
    if (textEncoderMrns.length) {
      paths.textEncoders = await Promise.all(
        textEncoderMrns.map(mrn => Metastable.instance.resolve(mrn)),
      );
    }

    return await loadCheckpoint(this.session!, {
      type: this.details.architecture!,
      paths,
      clipLayer: data.clipSkip ? -1 * data.clipSkip : undefined,
    });
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
      const maskImage = await this.prepareImage(maskUrl, fit);
      image.composite([
        { input: await maskImage.png().toBuffer(), blend: 'dest-out' },
      ]);
    }

    return await this.loadInputRaw(await image.png().toBuffer());
  }

  private async sample() {
    if (this.details?.guidanceMode === 'flux') {
      const { cfg, samplerName, schedulerName, steps, denoise, seed } =
        this.settings.sampler;
      const conditioning = await this.session!.api.sampling.fluxGuidance({
        conditioning: this.conditioning!.positive,
        guidance: cfg,
      });
      const guider = await this.checkpoint!.getBasicGuider(conditioning);

      return await guider.sample(
        {
          noise: await this.session!.api.sampling.randomNoise({ seed }),
          sampler: await this.session!.api.sampling.getSampler({ samplerName }),
          sigmas: await this.checkpoint!.getSigmas(
            schedulerName,
            steps,
            denoise,
          ),
          latent: this.latent!,
        },
        this.preview,
      );
    } else {
      return await this.checkpoint!.sample(
        this.latent!,
        this.conditioning!,
        {
          ...this.settings.sampler,
          isCircular: this.isCircular,
        },
        this.preview,
      );
    }
  }

  private async decode(samples: RPCRef<'LatentTensor'>) {
    if (this.details?.architecture === Architecture.HUNYUAN_VIDEO) {
      return await this.checkpoint!.decodeTiled(samples, 256, 64, 64, 8);
    } else {
      return await this.checkpoint!.decode(samples, this.isCircular);
    }
  }

  protected async process() {
    const ctx = this.session!;

    this.step('checkpoint');
    const settings = this.settings;
    this.checkpoint = await this.getCheckpoint();

    await this.executeHandlers('checkpoint');

    this.step('conditioning');
    const { style } = settings.prompt;
    let { positive, negative } = settings.prompt;

    positive = preprocessPrompt(positive);
    negative = preprocessPrompt(negative);

    if (style) {
      positive = applyStyleToPrompt(positive, style.positive);
      negative = applyStyleToPrompt(negative, style.negative);
    }

    this.conditioning = await this.checkpoint.conditioning(positive, negative);

    await this.executeHandlers('conditioning');

    this.isCircular = !!settings.sampler.tiling;

    this.step('input');
    switch (settings.input.type) {
      case ModelInputType.NONE:
        this.latent = await ctx.api.latent.empty({
          width: settings.output.width,
          height: settings.output.height,
          length: settings.output.frames,
          batchSize: settings.output.batchSize || 1,
          latentType: this.checkpoint.data.latentType,
        });
        break;
      case ModelInputType.IMAGE:
        {
          const { image } = await this.loadInput(
            settings.input.image!,
            settings.input.imageMode,
          );
          this.latent = await this.checkpoint.encode(image);
        }
        break;
      case ModelInputType.IMAGE_MASKED:
        {
          const { image, mask } = await this.loadInput(
            settings.input.image!,
            settings.input.imageMode,
            settings.input.mask,
          );
          this.latent = await this.checkpoint.encode(image, mask);
        }
        break;
    }

    if (settings.input.type !== ModelInputType.IMAGE) {
      settings.sampler.denoise = 1;
    }

    if (!this.latent) {
      return;
    }

    this.step('sample');
    const samples = await this.sample();

    this.step('decode');
    this.images = await this.decode(samples);

    await this.executeHandlers('postprocess');

    this.step('save');
    const ext = settings.output?.format || 'png';
    const outputs: ImageFile[] = [];
    const outputDir = this.project!.files.output.path;

    if (this.details?.architecture === Architecture.HUNYUAN_VIDEO) {
      const buffers: Uint8Array[] = [];
      const frameDelay = 1000 / 24;

      for (const image of this.images) {
        let buffer: Uint8Array = await ctx.api.image.dump({
          image,
          format: ext,
        });
        buffer = buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
        buffers.push(buffer);
      }

      const filename = await getNextFilename(outputDir, ext);
      const outputPath = path.join(outputDir, filename);
      const sharpImages = buffers.map(buffer => sharp(buffer));
      await apng.framesToApng(sharpImages, outputPath, {
        delay: frameDelay,
      });

      const output = await this.project!.files.output.get(filename);
      await output.metadata.set(settings);
      outputs.push(await output.json());
    } else {
      for (const image of this.images) {
        let buffer: Uint8Array = await ctx.api.image.dump({
          image,
          format: ext,
        });

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
    }

    this.data = {
      ...this.data,
      outputs,
    };
  }
}

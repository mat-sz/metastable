import {
  Architecture,
  ModelDetails,
  ModelType,
  ProjectTrainingSettings,
} from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseComfyTask, BaseComfyTaskHandlers } from './base.js';
import { ProjectEntity } from '../../data/project.js';
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

export class TrainingTask extends BaseComfyTask<
  PromptTaskHandlers,
  ProjectTrainingSettings
> {
  private details?: ModelDetails;
  private embeddingsPath?: string;
  private checkpointPaths?: ComfyCheckpointPaths;
  public preview: ComfyPreviewSettings = {
    method: 'auto',
  };
  private storeMetadata = false;
  public latent?: ComfyLatent;
  public checkpoint?: ComfyCheckpoint;
  public conditioning?: ComfyConditioning;
  public images?: RPCRef<'ImageTensor'>[];
  public isCircular = false;

  constructor(project: ProjectEntity, settings: ProjectTrainingSettings) {
    super('prompt', project, settings);
  }

  async init() {
    const settings = this.settings;

    if (settings.models.mode === 'simple') {
      await this.validateModel(
        ModelType.CHECKPOINT,
        true,
        settings.models.checkpoint,
      );
    }

    const baseData = await super.init();
    return {
      ...baseData,
    };
  }

  async getCheckpointPaths() {
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

    return paths;
  }

  async loadCheckpoint(paths: ComfyCheckpointPaths) {
    const clipSkip = this.settings.models.clipSkip;
    return await loadCheckpoint(this.session!, {
      type: this.details!.architecture!,
      paths,
      clipLayer: clipSkip ? -1 * clipSkip : undefined,
    });
  }

  protected async prepareModels() {
    const checkpointPaths = await this.getCheckpointPaths();
    this.checkpointPaths = checkpointPaths;

    if (checkpointPaths.checkpoint) {
      this.cachedModels.push({
        path: checkpointPaths.checkpoint,
        config_path: checkpointPaths.config,
        embeddings_path: checkpointPaths.embeddings,
      });
    }

    if (checkpointPaths.diffusionModel) {
      this.cachedModels.push({
        path: checkpointPaths.diffusionModel,
      });
    }

    if (checkpointPaths.vae) {
      this.cachedModels.push({
        path: checkpointPaths.vae,
      });
    }

    if (checkpointPaths.textEncoders?.length) {
      this.cachedModels.push({
        path: checkpointPaths.textEncoders.join(';'),
        embeddings_path: checkpointPaths.embeddings,
        model_type: this.details?.architecture,
      });
    }
  }

  protected async process() {
    const ctx = this.session!;

    this.step('checkpoint');
    this.checkpoint = await this.loadCheckpoint(this.checkpointPaths!);

    this.step('optimizer');
    const { diffusionModel, textEncoder } = this.checkpoint.data;
    const optimizer = await ctx.api.training.getOptimizer({
      diffusionModel,
      textEncoder,
    });

    this.step('train');
    await ctx.api.training.train({
      optimizer,
      diffusionModel,
      textEncoder,
      inputs: [],
    });

    this.data = {
      ...this.data,
    };
  }
}

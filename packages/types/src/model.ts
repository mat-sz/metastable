import { ProjectSimpleSettings } from './project.js';

export enum ModelType {
  CHECKPOINT = 'checkpoint',
  CLIP_VISION = 'clip_vision',
  CONTROLNET = 'controlnet',
  DIFFUSER = 'diffuser',
  DIFFUSION_MODEL = 'diffusion_model',
  EMBEDDING = 'embedding',
  GLIGEN = 'gligen',
  HYPERNETWORK = 'hypernetwork',
  IPADAPTER = 'ipadapter',
  LORA = 'lora',
  SEGMENT_ANYTHING = 'segment_anything',
  STYLE_MODEL = 'style_model',
  TAGGER = 'tagger',
  TEXT_ENCODER = 'text_encoder',
  UPSCALE_MODEL = 'upscale_model',
  VAE = 'vae',
}

export enum Architecture {
  SD1 = 'sd1',
  SD2 = 'sd2',
  SD3 = 'sd3',
  SDXL = 'sdxl',
  SVD = 'svd',
  STABLE_CASCADE = 'stable_cascade',
  PIXART = 'pixart',
  FLUX1 = 'flux1',
  HUNYUAN_VIDEO = 'hunyuan_video',
}

export enum ModelOutputType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface ModelMetadata {
  name?: string;
  description?: string;
  source?: string;
  sourceId?: string;
  nsfw?: boolean;
  samplerSettings?: Partial<ProjectSimpleSettings['sampler']>;
  homepage?: string;
  baseModel?: string;
}

export interface ModelDetails {
  corrupt?: boolean;
  architecture?: Architecture;
  type?: ModelType;
  outputType?: ModelOutputType;
}

export interface Model {
  id: string;
  mrn: string;
  coverMrn?: string;
  name: string;
  type: ModelType;
  file: {
    name: string;
    path: string;
    parts: string[];
    size: number;
  };
  metadata?: ModelMetadata;
  details?: ModelDetails;
}

export interface Metamodel {
  version: number;
  type: ModelType;
  models: {
    checkpoint?: string;
    diffusionModel?: string;
    textEncoders?: string[];
    vae?: string;
  };
}

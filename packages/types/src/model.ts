import { ImageInfo } from './file.js';
import { ProjectSimpleSettings } from './project.js';

export enum ModelType {
  CHECKPOINT = 'checkpoint',
  CLIP = 'clip',
  CLIP_VISION = 'clip_vision',
  CONTROLNET = 'controlnet',
  DIFFUSER = 'diffuser',
  EMBEDDING = 'embedding',
  GLIGEN = 'gligen',
  HYPERNETWORK = 'hypernetwork',
  IPADAPTER = 'ipadapter',
  LORA = 'lora',
  STYLE_MODEL = 'style_model',
  UPSCALE_MODEL = 'upscale_model',
  TAGGER = 'tagger',
  VAE = 'vae',
  VAE_APPROX = 'vae_approx',
}

export enum CheckpointType {
  SD1 = 'sd1',
  SD2 = 'sd2',
  SD3 = 'sd3',
  SDXL = 'sdxl',
  SVD = 'svd',
  STABLE_CASCADE = 'stable_cascade',
  PIXART = 'pixart',
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
  checkpointType?: CheckpointType;
  type?: ModelType;
}

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  file: {
    name: string;
    path: string;
    parts: string[];
    size: number;
  };
  metadata?: ModelMetadata;
  image?: ImageInfo;
  details?: ModelDetails;
}

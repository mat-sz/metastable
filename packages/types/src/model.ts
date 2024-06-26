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

export interface ModelInfo {
  name?: string;
  description?: string;
  source?: string;
  sourceId?: string;
  nsfw?: boolean;
  samplerSettings?: Partial<ProjectSimpleSettings['sampler']>;
  homepage?: string;
  baseModel?: string;
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
  metadata?: ModelInfo;
  image?: ImageInfo;
  details?: any;
}

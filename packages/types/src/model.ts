import { FileInfo } from './file.js';
import { ProjectSettings } from './project.js';

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
  VAE = 'vae',
  VAE_APPROX = 'vae_approx',
}

export interface ModelInfo {
  name?: string;
  description?: string;
  source?: string;
  sourceId?: string;
  nsfw?: boolean;
  samplerSettings?: Partial<ProjectSettings['sampler']>;
  homepage?: string;
  baseModel?: string;
}

export interface Model extends ModelInfo {
  name: string;
  file: FileInfo;
  image?: string;
}

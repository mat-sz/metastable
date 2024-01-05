import { FileInfo } from './file.js';

export enum ModelType {
  CHECKPOINT = 'checkpoints',
  CLIP = 'clip',
  CLIP_VISION = 'clip_vision',
  CONTROLNET = 'controlnet',
  DIFFUSER = 'diffusers',
  EMBEDDING = 'embeddings',
  GLIGEN = 'gligen',
  HYPERNETWORK = 'hypernetworks',
  LORA = 'loras',
  STYLE_MODEL = 'style_models',
  UPSCALE_MODEL = 'upscale_models',
  VAE = 'vae',
  VAE_APPROX = 'vae_approx',
}

export interface Model {
  file: FileInfo;
  name?: string;
  description?: string;
  source?: string;
  sourceId?: string;
  nsfw?: boolean;
  image?: string;
}

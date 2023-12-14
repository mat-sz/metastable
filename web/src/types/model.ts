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
  id: number;
  source: string;
  source_id?: string;
  name: string;
  nsfw?: boolean;
  type: ModelType;
}

export interface DownloadFile {
  filename: string;
  type: ModelType;
  url: string;
  size?: number;
}

export interface DownloadableModel extends Omit<Model, 'id'> {
  downloads: DownloadFile[];
  recommended?: boolean;
  description?: string;
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
  type: ModelType;
  recommended?: boolean;
  description?: string;
}

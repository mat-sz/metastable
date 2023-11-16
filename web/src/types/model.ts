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

export interface DownloadableModel extends Omit<Model, 'id'> {
  downloads: {
    filename: string;
    type: ModelType;
    url: string;
  }[];
  recommended?: boolean;
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
}

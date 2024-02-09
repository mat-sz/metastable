export interface ProjectInputEmpty {
  mode: 'empty';
  batch_size: number;
  width: number;
  height: number;
}

export interface ProjectInputImage {
  mode: 'image' | 'image_masked';
  image: string;
}

export type ProjectInput = ProjectInputEmpty | ProjectInputImage;

export interface ProjectSettings {
  input: ProjectInput;
  models: {
    base: { name: string; path?: string; embeddings_path?: string };
    loras?: {
      enabled: boolean;
      name?: string;
      path?: string;
      strength: number;
    }[];
    upscale?: { enabled: boolean; name?: string; path?: string };
    controlnets?: {
      enabled: boolean;
      name?: string;
      path?: string;
      strength: number;
      image: string;
      image_mode?: string;
    }[];
    ipadapters?: {
      enabled: boolean;
      name?: string;
      path?: string;
      weight: number;
      clip_vision_name?: string;
      clip_vision_path?: string;
      image?: string;
      image_mode?: string;
    }[];
  };
  conditioning: {
    positive: string;
    negative: string;
  };
  sampler: {
    seed: number;
    seed_randomize: boolean;
    steps: number;
    cfg: number;
    denoise: number;
    sampler: string;
    scheduler: string;
    tiling?: boolean;
    preview?: {
      method: string;
      taesd?: any;
    };
  };
}

export interface Project {
  id: string;
  name: string;
  type: string;
  settings: string;
  lastOutput?: string;
}

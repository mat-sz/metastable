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
    base: { name: string };
    loras: { name: string; strength: number }[];
    upscale?: { name: string };
    controlnets: {
      name: string;
      strength: number;
      image: string;
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
  };
}

export interface Project {
  id: number | string;
  name: string;
  settings: string;
  lastOutput?: string;
}

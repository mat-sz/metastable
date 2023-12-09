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
    controlnets: { name: string; strength: number; image: string }[];
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
  };
}

export interface APIProject {
  id: number;
  name: string;
  settings: string;
  lastOutput?: string;
}

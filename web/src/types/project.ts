export interface ProjectSettings {
  input: { batch_size: number; width: number; height: number };
  models: {
    base: { name: string };
    loras: { name: string; strength: number }[];
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
  last_output?: string;
}

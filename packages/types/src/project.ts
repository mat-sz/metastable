import { ImageFile } from './file.js';

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
    base: {
      name: string;
      path?: string;
      embeddings_path?: string;
      clip_skip?: number;
    };
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
  output?: {
    format?: string;
    path?: string;
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

export interface ProjectTrainingInputMetadata {
  crop?: [x: number, y: number, width: number, height: number];
  caption?: string;
}

export interface ProjectTrainingSettings {
  mode: 'lora';
  base: { name: string; path?: string; sdxl: boolean };
  resolution: { width: number; height: number };
  network: {
    dimensions: number;
    alpha: number;
  };
  learningRates: {
    network: number;
    unet: number;
    textEncoder: number;
  };
  learningRateScheduler: {
    name: string;
    number: number;
    warmupRatio: number;
    minSnrGamma: boolean;
  };
  optimizer: {
    name: string;
    arguments: string[];
  };
  dataset: {
    bucketing: boolean;
    activationTags: string[];
    shuffleTags: boolean;
    repeats: number;
  };
  limits: {
    trainingEpochs: number;
    saveEveryXEpochs: number;
    keepOnlyXEpochs: number;
    batchSize: number;
  };
}

export interface ProjectTaggingSettings {
  inputs: string[];
  threshold: number;
  removeUnderscore: boolean;
  tagger: {
    name: string;
    path?: string;
  };
}

export interface ProjectInfo {
  type: string;
}

export interface Project extends ProjectInfo {
  id: string;
  name: string;
  settings: any;
  lastOutput?: ImageFile;
  outputCount?: number;
  size?: number;
  temporary?: boolean;
}

export interface ProjectPromptTaskData {
  projectId: string;
  preview?: string;
  step?: string;
  stepValue?: number;
  stepMax?: number;
  outputs?: ImageFile[];
}

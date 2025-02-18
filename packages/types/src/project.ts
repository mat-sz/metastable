import { ImageFile } from './file.js';
import { PromptStyleItemWithSource } from './instance.js';
import { ModelInputType } from './model.js';

export interface BaseSettings {
  featureData?: any;
}

export interface ProjectSimpleSettings extends BaseSettings {
  version: number;
  models: {
    mode: 'simple' | 'advanced';
    checkpoint?: string;
    diffusionModel?: string;
    textEncoders?: string[];
    vae?: string;
    clipSkip?: number;
  };
  input: {
    type: ModelInputType;
    image?: string;
    imageMode?: ProjectImageMode;
    mask?: string;
    padEdges?: number;
  };
  output: {
    sizeMode: 'auto' | 'custom';
    orientation: ProjectOrientation;
    lockAspectRatio: boolean;
    width: number;
    height: number;
    batchSize: number;
    format?: string;
    frames?: number;
  };
  prompt: {
    positive: string;
    negative: string;
    style?: PromptStyleItemWithSource;
  };
  sampler: {
    quality: ProjectQuality;
    seed: number;
    steps: number;
    cfg: number;
    denoise: number;
    samplerName: string;
    schedulerName: string;
    tiling?: boolean;
  };
  client: {
    randomizeSeed: boolean;
  };
}

export interface ProjectTrainingInputMetadata {
  crop?: [x: number, y: number, width: number, height: number];
  caption?: string;
}

export interface ProjectTrainingSettings extends BaseSettings {
  version: number;
  models: {
    mode: 'simple' | 'advanced';
    checkpoint?: string;
    diffusionModel?: string;
    textEncoders?: string[];
    vae?: string;
    clipSkip?: number;
  };
  input: {
    resolution: { width: number; height: number };
    bucketing: boolean;
    activationTags: string[];
    shuffleTags: boolean;
    repeats: number;
  };
  output: {
    type: 'lora';
  };
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
  limits: {
    trainingEpochs: number;
    saveEveryXEpochs: number;
    keepOnlyXEpochs: number;
    batchSize: number;
  };
}

export interface ProjectTaggingSettings extends BaseSettings {
  inputs: string[];
  threshold: number;
  removeUnderscore: boolean;
  tagger: string;
}

export enum ProjectType {
  SIMPLE = 'simple',
  TRAINING = 'training',
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  settings?: any;
  ui?: any;
  lastOutput?: ImageFile;
  outputCount?: number;
  size?: number;
  draft?: boolean;
  favorite?: boolean;
}

export interface ProjectTaskData {
  projectId: string;
  preview?: string;
  step?: string;
  stepValue?: number;
  stepMax?: number;
  stepTime?: Record<string, number>;
  outputs?: ImageFile[];
  width?: number;
  height?: number;
}

export enum ProjectFileType {
  INPUT = 'input',
  MASK = 'mask',
  OUTPUT = 'output',
}

export type ProjectImageMode = 'cover' | 'contain' | 'center' | 'stretch';

export type ProjectQuality = 'low' | 'medium' | 'high' | 'very_high' | 'custom';

export type ProjectOrientation = 'square' | 'portrait' | 'landscape';

export interface PostprocessSettings extends BaseSettings {
  input: {
    image: string;
  };
  output?: {
    format?: string;
  };
}

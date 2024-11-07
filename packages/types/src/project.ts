import { ImageFile } from './file.js';
import { PromptStyleWithSource } from './instance.js';

export interface ProjectSimpleSettings {
  version: number;
  checkpoint:
    | {
        mode: 'simple';
        model?: string;
        clipSkip?: number;
      }
    | {
        mode: 'advanced';
        unet?: string;
        clip1?: string;
        clip2?: string;
        vae?: string;
      };
  input: {
    type: 'none' | 'image' | 'image_masked';
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
    path?: string;
  };
  prompt: {
    positive: string;
    negative: string;
    style?: PromptStyleWithSource;
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
  featureData?: any;
}

export interface ProjectTrainingInputMetadata {
  crop?: [x: number, y: number, width: number, height: number];
  caption?: string;
}

export interface ProjectTrainingSettings {
  mode: 'lora';
  base: string;
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
}

export interface ProjectTaskData {
  projectId: string;
}

export interface ProjectPromptTaskData extends ProjectTaskData {
  preview?: string;
  step?: string;
  stepValue?: number;
  stepMax?: number;
  stepTime?: Record<string, number>;
  outputs?: ImageFile[];
}

export enum ProjectFileType {
  INPUT = 'input',
  MASK = 'mask',
  OUTPUT = 'output',
}

export type ProjectImageMode = 'cover' | 'contain' | 'center' | 'stretch';

export type ProjectQuality = 'low' | 'medium' | 'high' | 'very_high' | 'custom';

export type ProjectOrientation = 'square' | 'portrait' | 'landscape';

import { ImageFile } from './file.js';
import { PromptStyleWithSource } from './instance.js';

export interface ProjectModel {
  name?: string;
  path?: string;
}
export interface ProjectSimpleSettings {
  version: number;
  checkpoint:
    | {
        mode: 'simple';
        name?: string;
        path?: string;
        clipSkip?: number;
      }
    | {
        mode: 'advanced';
        unet: ProjectModel;
        clip1: ProjectModel;
        clip2?: ProjectModel;
        vae: ProjectModel;
      };
  input: {
    type: 'none' | 'image' | 'image_masked';
    image?: string;
    imageMode?: string;
    mask?: string;
    processedImage?: string;
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
  models: {
    lora?: {
      enabled: boolean;
      strength: number;
      name?: string;
      path?: string;
    }[];
    controlnet?: {
      enabled: boolean;
      strength: number;
      name?: string;
      path?: string;
      image?: string;
      imageMode?: string;
      editor?: {
        name: string;
        data: any;
      };
    }[];
    ipadapter?: {
      enabled: boolean;
      strength: number;
      name?: string;
      path?: string;
      clipVisionName?: string;
      clipVisionPath?: string;
      image?: string;
      imageMode?: string;
    }[];
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
  upscale?: { enabled: boolean; name?: string; path?: string };
  client: {
    randomizeSeed: boolean;
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
  settings?: any;
  ui?: any;
  lastOutput?: ProjectImageFile;
  outputCount?: number;
  size?: number;
  temporary?: boolean;
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
  outputs?: ProjectImageFile[];
}

export enum ProjectFileType {
  INPUT = 'input',
  MASK = 'mask',
  OUTPUT = 'output',
}

export interface ProjectImageFile extends ImageFile {
  internalUrl: string;
}

export type ProjectQuality = 'low' | 'medium' | 'high' | 'very_high' | 'custom';

export type ProjectOrientation = 'square' | 'portrait' | 'landscape';

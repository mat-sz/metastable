import { Architecture, ProjectOrientation } from '@metastable/types';

export type Resolution = [width: number, height: number];

export const recommendedResolutions: Partial<
  Record<Architecture, Record<ProjectOrientation, Resolution[]>>
> = {
  [Architecture.SD1]: {
    square: [
      [512, 512],
      [768, 768],
    ],
    landscape: [
      [768, 512],
      [768, 576],
      [912, 512],
    ],
    portrait: [
      [512, 768],
      [576, 768],
      [512, 912],
    ],
  },
  [Architecture.SD2]: {
    square: [[768, 768]],
    landscape: [[1152, 768]],
    portrait: [[768, 1152]],
  },
  [Architecture.SD3]: {
    square: [[1024, 1024]],
    landscape: [[1152, 768]],
    portrait: [[768, 1152]],
  },
  [Architecture.SDXL]: {
    square: [
      [1024, 1024],
      [768, 768],
    ],
    landscape: [
      [1152, 768],
      [1152, 864],
      [1360, 768],
    ],
    portrait: [
      [768, 1152],
      [864, 1152],
      [768, 1360],
    ],
  },
  [Architecture.FLUX1]: {
    square: [
      [1024, 1024],
      [1536, 1536],
    ],
    landscape: [[1536, 1024]],
    portrait: [[1024, 1536]],
  },
  [Architecture.HUNYUAN_VIDEO]: {
    square: [
      [960, 960],
      [720, 720],
    ],
    landscape: [
      [1024, 576],
      [1280, 720],
      [960, 544],
    ],
    portrait: [
      [576, 1024],
      [720, 1280],
      [544, 960],
    ],
  },
};

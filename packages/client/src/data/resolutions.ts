import { CheckpointType, ProjectOrientation } from '@metastable/types';

export type Resolution = [width: number, height: number];

export const recommendedResolutions: Partial<
  Record<CheckpointType, Record<ProjectOrientation, Resolution[]>>
> = {
  [CheckpointType.SD1]: {
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
  [CheckpointType.SD2]: {
    square: [[768, 768]],
    landscape: [[1152, 768]],
    portrait: [[768, 1152]],
  },
  [CheckpointType.SD3]: {
    square: [[1024, 1024]],
    landscape: [[1152, 768]],
    portrait: [[768, 1152]],
  },
  [CheckpointType.SDXL]: {
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
  [CheckpointType.FLUX1]: {
    square: [
      [1024, 1024],
      [1536, 1536],
    ],
    landscape: [[1536, 1024]],
    portrait: [[1024, 1536]],
  },
};

export enum ModelBaseType {
  SD1 = 'sd1',
  SD2 = 'sd2',
  SD3 = 'sd3',
  SDXL = 'sdxl',
  SVD = 'svd',
  STABLE_CASCADE = 'stable_cascade',
  PIXART = 'pixart',
  UNKNOWN = 'unknown',
}

export interface ModelDetails {
  baseType: ModelBaseType;
}

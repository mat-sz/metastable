import { ModelType } from '@metastable/types';

export interface CivitAIModelVersionFile {
  sizeKB: number;
  pickleScanResult: string;
  virusScanResult: string;
  scannedAt: string | null;
  primary?: boolean;
  name: string;
  downloadUrl: string;
  metadata: {
    fp?: 'fp16' | 'fp32' | null;
    size?: 'full' | 'pruned' | null;
    format?: 'SafeTensor' | 'PickleTensor' | 'Other' | null;
  };
}

export interface CivitAIModelVersionImage {
  id: string;
  url: string;
  nsfw: string;
  width: number;
  height: number;
  hash: string;
  type: 'image' | 'video';
  meta?: Record<string, string | number> | null;
}

export interface CivitAIModelVersion {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  trainedWords: string[];
  baseModel?: string;
  baseModelType?: string;
  files: CivitAIModelVersionFile[];
  images: CivitAIModelVersionImage[];
  stats: {
    downloadCount: number;
    ratingCount: number;
    rating: number;
  };
}

// Checkpoint, TextualInversion, Hypernetwork, AestheticGradient, LORA, Controlnet, Poses

export const CivitAITypeMap: Record<string, ModelType> = {
  Checkpoint: ModelType.CHECKPOINT,
  TextualInversion: ModelType.EMBEDDING,
  Hypernetwork: ModelType.HYPERNETWORK,
  LORA: ModelType.LORA,
  Controlnet: ModelType.CONTROLNET,
};

export interface CivitAIModel {
  id: number;
  name: string;
  description: string;
  type: string;
  nsfw: boolean;
  tags: string[];
  mode: 'Archived' | 'TakenDown' | null;
  creator: {
    username: string;
    image: string | null;
  };
  stats: {
    downloadCount: number;
    favoriteCount: number;
    commentCount: number;
    ratingCount: number;
    rating: number;
  };
  modelVersions: CivitAIModelVersion[];
}

export interface CivitAIResponse {
  items: CivitAIModel[];
  metadata: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    nextPage: string;
    prevPage: string;
  };
}

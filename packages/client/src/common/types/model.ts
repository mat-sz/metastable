import {
  DownloadSettings,
  Metamodel,
  ModelMetadata,
  ModelType,
} from '@metastable/types';

export enum DownloadableModelWarning {
  HF_GATED = 'hfGated',
  AUTHORIZATION_REQUIRED = 'authorizationRequired',
}

export interface DownloadableModel extends ModelMetadata {
  type: ModelType;
  downloads: DownloadSettings[];
  recommended?: boolean;
  warnings?: DownloadableModelWarning[];
  createMetamodel?: {
    name: string;
    metamodel: Metamodel;
    metadata?: ModelMetadata;
  };
}

export interface DownloadableModelGroup {
  name: string;
  models: DownloadableModel[];
  type: ModelType;
  recommended?: boolean;
  description?: string;
}

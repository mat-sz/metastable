import {
  DownloadSettings,
  Metamodel,
  Model,
  ModelMetadata,
  ModelType,
  TreeGroup,
  TreeItem,
} from '@metastable/types';

export enum DownloadableModelWarning {
  HF_GATED = 'hfGated',
  AUTHORIZATION_REQUIRED = 'authorizationRequired',
}

export interface DownloadableModelDownloadSettings extends DownloadSettings {
  ignoreParentMetadata?: boolean;
}

export interface DownloadableModel {
  name: string;
  source?: string;
  homepage?: string;
  description?: string;
  type: ModelType;
  downloads: DownloadableModelDownloadSettings[];
  recommended?: boolean;
  warnings?: DownloadableModelWarning[];
  createMetamodel?: {
    name: string;
    type: ModelType;
    models: Metamodel['models'];
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

export interface ModelTreeItem extends TreeItem, Model {}

export type ModelTreeNode = ModelTreeItem | TreeGroup;

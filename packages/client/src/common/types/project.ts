import { ImageFile, TreeGroup, TreeItem } from '@metastable/types';

export interface ImageFileTreeItem extends TreeItem, ImageFile {}

export type ImageFileTreeNode = ImageFileTreeItem | TreeGroup;

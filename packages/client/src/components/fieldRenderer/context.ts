import { Architecture } from '@metastable/types';
import React from 'react';

import { ImageFileTreeNode } from '$types/project';
export interface IFieldContext {
  architecture?: Architecture;
  imageFiles?: ImageFileTreeNode[];
  collapsed?: Record<string, boolean>;
  onToggleCollapsed?: (key: string, collapsed: boolean) => void;
}

export const FieldContext = React.createContext<IFieldContext>({});

export function useFieldContext() {
  return React.useContext(FieldContext);
}

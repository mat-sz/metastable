import { Architecture, ImageFile } from '@metastable/types';
import React from 'react';

export interface IFieldContext {
  architecture?: Architecture;
  imageFiles?: ImageFile[];
  collapsed?: Record<string, boolean>;
  onToggleCollapsed?: (key: string, collapsed: boolean) => void;
}

export const FieldContext = React.createContext<IFieldContext>({});

export function useFieldContext() {
  return React.useContext(FieldContext);
}

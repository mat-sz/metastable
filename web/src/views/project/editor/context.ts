import React from 'react';

import type { Editor } from './src';

export const EditorContext = React.createContext<Editor>(undefined as any);
export function useEditor() {
  return React.useContext(EditorContext);
}

import React from 'react';

import type { Editor } from '@editor';

export const EditorContext = React.createContext<Editor>(undefined as any);
export function useEditor() {
  return React.useContext(EditorContext);
}

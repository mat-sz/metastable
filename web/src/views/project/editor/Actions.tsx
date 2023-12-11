import React from 'react';

import type { Editor } from './src';
import { mainStore } from '../../../stores/MainStore';
import { VarButton } from 'react-var-ui';

export interface ActionsProps {
  editor: Editor;
}

export const Actions: React.FC<ActionsProps> = ({ editor }) => {
  return (
    <>
      <VarButton
        buttonLabel="Run img2img"
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.addOutputToEditor = editor.selection.offset;
          mainStore.project!.settings.input = {
            mode: 'image',
            image: url,
          };
          mainStore.project!.request();
        }}
      />
      <VarButton
        buttonLabel="Run inpainting"
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.addOutputToEditor = editor.selection.offset;
          mainStore.project!.settings.input = {
            mode: 'image_masked',
            image: url,
          };
          mainStore.project!.request();
        }}
      />
    </>
  );
};

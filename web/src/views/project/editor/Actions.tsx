import React from 'react';
import { VarButton } from 'react-var-ui';

import { mainStore } from '../../../stores/MainStore';
import { useEditor } from './context';

export const Actions: React.FC = () => {
  const editor = useEditor();

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

import React from 'react';

import { mainStore } from '../../../stores/MainStore';
import { IconButton } from '../../../components';
import { useEditor } from './context';
import { BsBrushFill, BsImages } from 'react-icons/bs';

export const Actions: React.FC = () => {
  const editor = useEditor();

  return (
    <>
      <IconButton
        title="Run img2img"
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.addOutputToEditor = editor.selection.offset;
          mainStore.project!.settings.input = {
            mode: 'image',
            image: url,
          };
          mainStore.project!.request();
        }}
      >
        <BsImages />
      </IconButton>
      <IconButton
        title="Run inpainting"
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.addOutputToEditor = editor.selection.offset;
          mainStore.project!.settings.input = {
            mode: 'image_masked',
            image: url,
          };
          mainStore.project!.request();
        }}
      >
        <BsBrushFill />
      </IconButton>
    </>
  );
};

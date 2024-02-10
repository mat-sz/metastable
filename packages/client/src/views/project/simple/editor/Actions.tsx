import React from 'react';
import { BsBrushFill, BsImages } from 'react-icons/bs';

import { IconButton } from '@components/iconButton';
import { useEditor } from './context';
import { useSimpleProject } from '../../context';

export const Actions: React.FC = () => {
  const editor = useEditor();
  const project = useSimpleProject();

  return (
    <>
      <IconButton
        title="Run img2img"
        onClick={() => {
          const url = editor.renderSelection();
          project.addOutputToEditor = editor.selection.offset;
          project.settings.input = {
            mode: 'image',
            image: url,
          };
          project.request();
        }}
      >
        <BsImages />
      </IconButton>
      <IconButton
        title="Run inpainting"
        onClick={() => {
          const url = editor.renderSelection();
          project.addOutputToEditor = editor.selection.offset;
          project.settings.input = {
            mode: 'image_masked',
            image: url,
          };
          project.request();
        }}
      >
        <BsBrushFill />
      </IconButton>
    </>
  );
};

import React from 'react';

import { Button } from '$components/button';
import { useEditor } from './context';
import { useSimpleProject } from '../../context';

export const Actions: React.FC = () => {
  const editor = useEditor();
  const project = useSimpleProject();

  return (
    <>
      <Button
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
        IMG2IMG
      </Button>
      <Button
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
        Inpainting
      </Button>
    </>
  );
};

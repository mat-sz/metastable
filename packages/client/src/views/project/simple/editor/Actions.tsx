import { ModelInputType } from '@metastable/types';
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
          const { url, width, height } = editor.renderSelection();
          project.addOutputToEditor = editor.selection.offset;
          project.settings.input = {
            type: ModelInputType.IMAGE,
            image: url,
          };
          project.settings.output = {
            ...project.settings.output,
            width,
            height,
            batchSize: 1,
          };
          project.request();
        }}
      >
        IMG2IMG
      </Button>
      <Button
        onClick={() => {
          const { url, width, height } = editor.renderSelection();
          project.addOutputToEditor = editor.selection.offset;
          project.settings.input = {
            type: ModelInputType.IMAGE_MASKED,
            image: url,
          };
          project.settings.output = {
            ...project.settings.output,
            sizeMode: 'custom',
            width,
            height,
            batchSize: 1,
          };
          project.request();
        }}
      >
        Inpainting
      </Button>
    </>
  );
};

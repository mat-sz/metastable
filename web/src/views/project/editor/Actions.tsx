import React from 'react';

import styles from './index.module.scss';
import type { Editor } from './src';
import { mainStore } from '../../../stores/MainStore';

export interface ActionsProps {
  editor: Editor;
}

export const Actions: React.FC<ActionsProps> = ({ editor }) => {
  return (
    <div className={styles.actions}>
      <button
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.settings.input = {
            mode: 'image',
            image: url,
          };
          mainStore.project!.request();
        }}
      >
        img2img
      </button>
      <button
        onClick={() => {
          const url = editor.renderSelection();
          mainStore.project!.settings.input = {
            mode: 'image_masked',
            image: url,
          };
          mainStore.project!.request();
        }}
      >
        inpainting
      </button>
    </div>
  );
};

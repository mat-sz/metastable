import React from 'react';
import { BsFillFloppy2Fill } from 'react-icons/bs';

import styles from './index.module.scss';
import { useEditor } from './context';
import { IconButton } from '../../../components';
import { mainStore } from '../../../stores/MainStore';

export const ProjectActions: React.FC = () => {
  const editor = useEditor();

  return (
    <div className={styles.projectActions}>
      <IconButton
        title="Save"
        onClick={() => {
          const url = editor.renderProject();
          const element = document.createElement('a');
          element.setAttribute('href', url);
          element.setAttribute(
            'download',
            `${mainStore.project?.name || 'metastable'}.png`,
          );

          element.style.display = 'none';
          element.click();
        }}
      >
        <BsFillFloppy2Fill />
      </IconButton>
    </div>
  );
};
import React from 'react';
import { BsFillFloppy2Fill } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { useEditor } from './context';
import styles from './index.module.scss';
import { useSimpleProject } from '../../context';

export const ProjectActions: React.FC = () => {
  const editor = useEditor();
  const project = useSimpleProject();

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
            `${project.name || 'metastable'}.png`,
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

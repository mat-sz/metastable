import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Preview.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Preview: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <div className={styles.preview}>
      {project.outputFilenames.map(filename => (
        <img src={project.view('output', filename)} key={filename} />
      ))}
    </div>
  );
});

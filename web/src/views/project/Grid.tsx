import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Grid.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Grid: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <div className={styles.grid}>
      {project.allOutputs.map((filename, i) => (
        <a
          href={project.view('output', filename)}
          target="_blank"
          rel="noopener noreferrer"
          key={i}
        >
          <img src={project.view('output', filename)} />
        </a>
      ))}
    </div>
  );
});

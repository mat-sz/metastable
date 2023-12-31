import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';

export const Grid: React.FC = observer(() => {
  const project = mainStore.project!;
  const outputs = [...project.allOutputs].reverse();

  if (!outputs.length) {
    return <div className={styles.info}>No project output images found.</div>;
  }

  return (
    <div className={styles.grid}>
      {outputs.map((filename, i) => (
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

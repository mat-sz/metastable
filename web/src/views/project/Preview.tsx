import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Preview.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Preview: React.FC = observer(() => {
  const project = mainStore.project!;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = project.outputFilenames[selectedIndex];
  const path =
    selected && project.view('output', project.outputFilenames[selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [project.outputFilenames, setSelectedIndex]);

  return (
    <div className={styles.preview}>
      <div className={styles.image}>{path && <img src={path} />}</div>
      {project.outputFilenames.length > 1 && (
        <div className={styles.thumbnails}>
          {project.outputFilenames.map((filename, i) => (
            <img
              className={selectedIndex === i ? styles.selected : undefined}
              src={project.view('output', filename)}
              key={i}
              onClick={() => setSelectedIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

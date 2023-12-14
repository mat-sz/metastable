import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton } from 'react-var-ui';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { Settings } from '../settings';
import { ImagePreview } from '../../../components/ImagePreview';

export const Images: React.FC = observer(() => {
  const project = mainStore.project!;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = project.outputFilenames[selectedIndex];
  const path =
    selected && project.view('output', project.outputFilenames[selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [project.outputFilenames, setSelectedIndex]);

  return (
    <div className={styles.main}>
      <div className={styles.preview}>
        <ImagePreview url={path} />
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
      <Settings
        actions={
          <VarButton
            buttonLabel="Request image"
            onClick={() => project.request()}
          />
        }
      />
    </div>
  );
});

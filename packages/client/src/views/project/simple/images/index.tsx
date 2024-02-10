import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsPlay } from 'react-icons/bs';

import styles from './index.module.scss';
import { Settings } from '../settings';
import { IconButton, ImagePreview } from '../../../../components';
import { useSimpleProject } from '../../context';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filenames = project.outputFilenames;

  const selected = filenames[selectedIndex];
  const path = selected && project.view('output', filenames[selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filenames, setSelectedIndex]);

  return (
    <div className={styles.main}>
      <div className={styles.preview}>
        {filenames.length ? (
          <ImagePreview url={path} />
        ) : (
          <div className={styles.info}>Your output image will appear here.</div>
        )}
        {filenames.length > 1 && (
          <div className={styles.thumbnails}>
            {filenames.map((filename, i) => (
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
          <IconButton title="Request image" onClick={() => project.request()}>
            <BsPlay />
          </IconButton>
        }
      />
    </div>
  );
});

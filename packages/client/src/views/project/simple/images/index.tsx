import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsPlay } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImagePreview } from '$components/imagePreview';
import styles from './index.module.scss';
import { Settings } from '../settings';
import { useSimpleProject } from '../../context';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const outputs = project.currentOutputs;

  const selected = outputs[selectedIndex];

  useEffect(() => {
    setSelectedIndex(0);
  }, [outputs, setSelectedIndex]);

  return (
    <div className={styles.main}>
      <div className={styles.preview}>
        {outputs.length ? (
          <ImagePreview url={selected.image.url} />
        ) : (
          <div className={styles.info}>Your output image will appear here.</div>
        )}
        {outputs.length > 1 && (
          <div className={styles.thumbnails}>
            {outputs.map((file, i) => (
              <img
                className={selectedIndex === i ? styles.selected : undefined}
                src={file.image?.thumbnailUrl}
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

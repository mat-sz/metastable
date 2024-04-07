import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { BsPlay } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImagePreview } from '$components/imagePreview';
import { ProgressBar } from '$components/progressBar';
import styles from './index.module.scss';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const outputs = project.currentOutputs;

  const selected = outputs[selectedIndex];
  const preview = project.preview;

  useEffect(() => {
    setSelectedIndex(0);
  }, [outputs, setSelectedIndex]);

  return (
    <div className={styles.main}>
      <div className={styles.preview}>
        {project.progressValue ? (
          <div className={styles.progressPreview}>
            <div>
              <div>Generating...</div>
              <div className={styles.progressBar}>
                <ProgressBar
                  value={project.progressValue}
                  max={project.progressMax}
                  marquee={project.progressMarquee}
                />
              </div>
              {preview ? <img src={preview} /> : undefined}
            </div>
          </div>
        ) : (
          <>
            {outputs.length ? (
              <ImagePreview url={selected.image.url} />
            ) : (
              <div className={styles.info}>
                Your output image will appear here.
              </div>
            )}
            {outputs.length > 1 && (
              <div className={styles.thumbnails}>
                {outputs.map((file, i) => (
                  <img
                    className={
                      selectedIndex === i ? styles.selected : undefined
                    }
                    src={file.image?.thumbnailUrl}
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                  />
                ))}
              </div>
            )}
          </>
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

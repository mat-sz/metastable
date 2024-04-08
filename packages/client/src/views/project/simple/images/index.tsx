import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsPlay } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImagePreview } from '$components/imagePreview';
import { ProgressBar } from '$components/progressBar';
import styles from './index.module.scss';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const preview = project.preview;

  return (
    <div className={styles.main}>
      <div className={styles.preview}>
        {!project.currentOutput && project.progressValue ? (
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
            {project.currentOutput ? (
              <ImagePreview url={project.currentOutput} />
            ) : (
              <div className={styles.info}>
                Your output image will appear here.
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

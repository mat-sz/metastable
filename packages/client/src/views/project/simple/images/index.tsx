import { observer } from 'mobx-react-lite';
import React from 'react';

import { ImagePreview } from '$components/imagePreview';
import { ProgressBar } from '$components/progressBar';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const preview = project.preview;

  return (
    <div className={styles.main}>
      <div className={styles.center}>
        {project.currentOutput && (
          <div className={styles.actions}>
            <div>{project.currentOutput.name}</div>
            <div className={styles.buttons}>
              <ImageActions file={project.currentOutput} />
            </div>
          </div>
        )}
        <div className={styles.preview}>
          {!project.currentOutput && project.firstPrompt ? (
            <div className={styles.progressPreview}>
              <div>
                <div>{project.firstPrompt.data.step}...</div>
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
                <ImagePreview url={project.currentOutput.image.url} />
              ) : (
                <div className={styles.info}>
                  Your output image will appear here.
                </div>
              )}
            </>
          )}
        </div>
        <Prompt />
      </div>
      <Settings className={styles.settings} />
    </div>
  );
});

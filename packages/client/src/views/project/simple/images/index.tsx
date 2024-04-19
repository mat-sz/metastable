import { observer } from 'mobx-react-lite';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { ImagePreview } from '$components/imagePreview';
import { ProgressBar } from '$components/progressBar';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
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
            <Button
              onClick={async () => {
                if (!project.currentOutput) {
                  return;
                }

                const data = await API.project.output.get.query({
                  projectId: project.id,
                  name: project.currentOutput.name,
                });
                const settings = data.metadata as any;
                if (settings) {
                  project.setSettings(settings);
                }
              }}
            >
              Load settings from current image
            </Button>
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

import { TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { ImagePreview } from '$components/imagePreview';
import { LogSimple } from '$components/log';
import { ProgressBar } from '$components/progressBar';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const preview = project.preview;

  let mode: string | undefined = undefined;
  const task =
    project.currentTask ||
    (!project.currentOutput ? project.prompts[0] : undefined);

  if (!project.currentTask && !project.currentOutput && project.firstPrompt) {
    mode = 'progress';
  } else if (task) {
    mode = 'task';
  } else if (project.currentOutput) {
    mode = 'image';
  }

  return (
    <div className={styles.main}>
      <div className={styles.center}>
        {mode === 'progress' && (
          <div className={styles.preview}>
            <div className={styles.progressPreview}>
              <div>
                <div>{project.firstPrompt!.data.step}...</div>
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
          </div>
        )}
        {mode === 'task' && (
          <div className={styles.preview}>
            <div className={styles.progressPreview}>
              {task?.state === TaskState.FAILED && (
                <div>
                  <div>Image generation failed.</div>
                  {task.log && <LogSimple log={task.log} />}
                  <div>
                    <Button
                      onClick={() => {
                        project.selectTask(undefined);
                        mainStore.tasks.dismiss('project', task.id);
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              {task?.state === TaskState.QUEUED && (
                <div>
                  <div>Image generation queued.</div>
                </div>
              )}
            </div>
          </div>
        )}
        {mode === 'image' && (
          <>
            <div className={styles.actions}>
              <div>{project.currentOutput!.name}</div>
              <div className={styles.buttons}>
                <ImageActions file={project.currentOutput!} />
              </div>
            </div>
            <div className={styles.preview}>
              <ImagePreview url={project.currentOutput!.image.url} />
            </div>
          </>
        )}
        {!mode && (
          <div className={styles.info}>Your output image will appear here.</div>
        )}
        <Prompt />
      </div>
      <Settings className={styles.settings} />
    </div>
  );
});

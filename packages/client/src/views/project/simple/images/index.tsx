import { ProjectFileType, TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { ImagePreview } from '$components/imagePreview';
import { LogSimple } from '$components/log';
import { ProgressCircle } from '$components/progressCircle';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';
import { Settings } from '../settings';

const STEP_MAP: Record<string, string> = {
  checkpoint: 'Loading checkpoint...',
  lora: 'Loading LoRAs...',
  conditioning: 'Conditioning...',
  controlnet: 'Loading ControlNets...',
  ipadapter: 'Loading IPAdapter...',
  input: 'Preparing input...',
  sample: 'Sampling...',
  upscale: 'Upscaling...',
  save: 'Saving...',
  pulid: 'Loading PuLID...',
};

const GenerationProgress = observer(() => {
  const project = useSimpleProject();
  const preview = project.preview;

  if (!project.firstPrompt) {
    return null;
  }

  const { step = '', stepValue, stepMax } = project.firstPrompt.data;

  const stepName = STEP_MAP[step] ? STEP_MAP[step] : 'Loading...';
  const stepProgress =
    typeof stepMax === 'number' ? ` (${stepValue || 0}/${stepMax})` : '';
  const stepInfo = `${stepName}${stepProgress}`;

  return (
    <div className={styles.preview}>
      <div className={styles.progressPreview}>
        <div className={styles.layer}>
          <div className={styles.stepInfo}>
            <ProgressCircle
              value={project.progressValue || 0}
              max={project.progressMax || 1}
              hideText
            />
            <div>{stepInfo}</div>
          </div>
          <div className={styles.imageContainer}>
            {preview ? <img src={preview} /> : undefined}
          </div>
        </div>
      </div>
    </div>
  );
});

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();

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
        {mode === 'progress' && <GenerationProgress />}
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
            <div className={styles.imageActions}>
              <div>{project.currentOutput!.name}</div>
              <div className={styles.buttons}>
                <ImageActions
                  file={project.currentOutput!}
                  type={ProjectFileType.OUTPUT}
                />
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

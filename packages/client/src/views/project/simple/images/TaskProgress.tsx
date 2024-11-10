import { ProjectTaskData, Task } from '@metastable/types';
import React from 'react';

import { ProgressCircle } from '$components/progressCircle';
import styles from './TaskProgress.module.scss';

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

interface TaskProgressProps {
  task: Task<ProjectTaskData>;
  aspectRatio?: number;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  task,
  aspectRatio = 1,
}) => {
  const { step = '', stepValue, stepMax, preview } = task.data;

  const stepName = STEP_MAP[step] ? STEP_MAP[step] : 'Loading...';
  const stepProgress =
    typeof stepMax === 'number' ? ` (${stepValue || 0}/${stepMax})` : '';
  const stepInfo = `${stepName}${stepProgress}`;

  return (
    <div className={styles.preview}>
      <div className={styles.progressPreview}>
        <div className={styles.imageContainer}>
          {preview ? (
            <img src={preview} />
          ) : (
            <div className={styles.placeholder} style={{ aspectRatio }} />
          )}
        </div>
        <div className={styles.stepInfo}>
          <ProgressCircle value={task.progress || 0} max={1} hideText />
          <div>{stepInfo}</div>
        </div>
      </div>
    </div>
  );
};

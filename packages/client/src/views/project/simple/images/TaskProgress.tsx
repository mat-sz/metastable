import { ProjectTaskData, Task } from '@metastable/types';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ProgressCircle } from '$components/progressCircle';
import styles from './TaskProgress.module.scss';

interface TaskProgressProps {
  task: Task<ProjectTaskData>;
  aspectRatio?: number;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  task,
  aspectRatio = 1,
}) => {
  const { t } = useTranslation('task');
  const { step = 'default', stepValue, stepMax, preview } = task.data;

  const stepName = t(`task:step.${step}`);
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

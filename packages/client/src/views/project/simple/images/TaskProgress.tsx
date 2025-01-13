import { ProjectTaskData, Task } from '@metastable/types';
import React from 'react';
import { useTranslation } from 'react-i18not';

import { ProgressCircle } from '$components/progressCircle';
import styles from './TaskProgress.module.scss';

interface TaskProgressProps {
  task: Task<ProjectTaskData>;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
  const { t } = useTranslation('task');
  const {
    step = 'default',
    stepValue,
    stepMax,
    preview,
    width = 0,
    height = 0,
  } = task.data;

  const stepName = t(`task:step.${step}`);
  const stepProgress =
    typeof stepMax === 'number' ? ` (${stepValue || 0}/${stepMax})` : '';
  const stepInfo = `${stepName}${stepProgress}`;

  return (
    <div className={styles.preview}>
      <div
        className={styles.progressPreview}
        style={{ aspectRatio: width / height }}
      >
        <div
          className={styles.imageContainer}
          style={{ backgroundImage: `url(${preview})` }}
        />
        <div className={styles.stepInfo}>
          <ProgressCircle value={task.progress || 0} max={1} hideText />
          <div>{stepInfo}</div>
        </div>
      </div>
    </div>
  );
};

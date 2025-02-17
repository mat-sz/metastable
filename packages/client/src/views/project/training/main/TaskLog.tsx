import { ProjectTaskData, Task, TaskState } from '@metastable/types';
import React from 'react';
import { useTranslation } from 'react-i18not';

import { Button } from '$components/button';
import { LogSimple } from '$components/log';
import { mainStore } from '$stores/MainStore';
import styles from './TaskLog.module.scss';
import { useTrainingProject } from '../../context';

interface TaskLogProps {
  task: Task<ProjectTaskData>;
}

export const TaskLog: React.FC<TaskLogProps> = ({ task }) => {
  const project = useTrainingProject();
  const { t } = useTranslation('task');
  const taskType = t(`task:type.${task.type}`);

  return (
    <div className={styles.log}>
      {task.state === TaskState.FAILED && (
        <>
          <div>{taskType} failed.</div>
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
        </>
      )}
      {task.state === TaskState.QUEUED && <div>{taskType} queued.</div>}
    </div>
  );
};

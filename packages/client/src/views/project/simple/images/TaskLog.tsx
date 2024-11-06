import { ProjectPromptTaskData, Task, TaskState } from '@metastable/types';
import React from 'react';

import { Button } from '$components/button';
import { LogSimple } from '$components/log';
import { mainStore } from '$stores/MainStore';
import styles from './TaskLog.module.scss';
import { useSimpleProject } from '../../context';

interface TaskLogProps {
  task: Task<ProjectPromptTaskData>;
}

export const TaskLog: React.FC<TaskLogProps> = ({ task }) => {
  const project = useSimpleProject();

  return (
    <div className={styles.log}>
      {task.state === TaskState.FAILED && (
        <>
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
        </>
      )}
      {task.state === TaskState.QUEUED && <div>Image generation queued.</div>}
    </div>
  );
};

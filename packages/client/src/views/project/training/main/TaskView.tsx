import { ProjectTaskData, Task, TaskState } from '@metastable/types';
import React from 'react';

import { TaskLog } from './TaskLog';
import { TaskProgress } from './TaskProgress';

interface TaskViewProps {
  task: Task<ProjectTaskData>;
}

export const TaskView: React.FC<TaskViewProps> = ({ task }) => {
  return task.state === TaskState.RUNNING ? (
    <TaskProgress task={task} />
  ) : (
    <TaskLog task={task} />
  );
};

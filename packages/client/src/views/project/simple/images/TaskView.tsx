import { ProjectTaskData, Task, TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { TaskLog } from './TaskLog';
import { TaskProgress } from './TaskProgress';
import { useSimpleProject } from '../../context';

interface TaskViewProps {
  task: Task<ProjectTaskData>;
}

export const TaskView: React.FC<TaskViewProps> = observer(({ task }) => {
  const project = useSimpleProject();
  const { width, height } = project.settings.output;
  const aspectRatio = width / height;

  if (task.state === TaskState.RUNNING) {
    return <TaskProgress task={task} aspectRatio={aspectRatio} />;
  }

  return <TaskLog task={task} />;
});

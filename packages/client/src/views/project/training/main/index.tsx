import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import styles from './index.module.scss';
import { useTrainingProject } from '../../context';
import { Settings } from '../settings';
import { TaskView } from './TaskView';

const Preview: React.FC = observer(() => {
  const project = useTrainingProject();
  const task = project.viewTask;

  if (task) {
    return <TaskView task={task} />;
  } else
    return (
      <div className={styles.info}>Your output image will appear here.</div>
    );
});

export const Main: React.FC = observer(() => {
  const project = useTrainingProject();

  return (
    <div className={styles.main}>
      <Preview />
      <Settings
        className={styles.settings}
        actions={<Button onClick={() => project.request()}>Train</Button>}
      />
    </div>
  );
});

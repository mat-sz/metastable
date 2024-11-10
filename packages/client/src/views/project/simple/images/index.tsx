import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { SplitView } from '$components/splitView';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';
import { Output } from './Output';
import { TaskView } from './TaskView';

const Preview: React.FC = observer(() => {
  const project = useSimpleProject();
  const task =
    project.currentTask ||
    (!project.currentOutput ? project.firstTask : undefined);

  if (task) {
    return <TaskView task={task} />;
  } else if (project.currentOutput) {
    return <Output output={project.currentOutput} />;
  }

  return <div className={styles.info}>Your output image will appear here.</div>;
});

export const Images: React.FC = observer(() => {
  const project = useSimpleProject();
  const { imagesSplit = [9, 1] } = project.ui;

  return (
    <div className={styles.main}>
      <SplitView
        className={styles.center}
        direction="vertical"
        minSizes={['0', '20rem']}
        sizes={imagesSplit}
        onChange={sizes => {
          runInAction(() => {
            project.ui.imagesSplit = sizes;
          });
        }}
      >
        <Preview />
        <Prompt />
      </SplitView>
      <Settings className={styles.settings} />
    </div>
  );
});

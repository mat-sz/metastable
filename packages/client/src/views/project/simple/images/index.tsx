import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { SplitView } from '$components/splitView';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';
import { Output } from './Output';
import { TaskLog } from './TaskLog';
import { TaskProgress } from './TaskProgress';

const Preview: React.FC = observer(() => {
  const project = useSimpleProject();
  const task =
    project.currentTask ||
    (!project.currentOutput ? project.prompts[0] : undefined);

  if (!project.currentTask && !project.currentOutput && project.firstPrompt) {
    const { width, height } = project.settings.output;
    const aspectRatio = width / height;
    return (
      <TaskProgress task={project.firstPrompt} aspectRatio={aspectRatio} />
    );
  } else if (task) {
    return <TaskLog task={task} />;
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

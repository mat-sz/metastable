import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { SplitView } from '$components/splitView';
import { useHotkey } from '$hooks/useHotkey';
import { MAX_DISPLAY_OUTPUTS } from '$stores/project/simple';
import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';
import { Output } from './Output';
import { TaskView } from './TaskView';

const Preview: React.FC = observer(() => {
  const project = useSimpleProject();
  const task = project.viewTask;

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

  const previousOutput = useCallback(() => {
    project.selectOutputByOffset(1, MAX_DISPLAY_OUTPUTS);
  }, [project]);
  const nextOutput = useCallback(() => {
    project.selectOutputByOffset(-1, MAX_DISPLAY_OUTPUTS);
  }, [project]);
  useHotkey('project_previousOutput', previousOutput);
  useHotkey('project_nextOutput', nextOutput);

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

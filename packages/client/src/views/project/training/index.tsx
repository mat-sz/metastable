import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsGrid, BsWrench } from 'react-icons/bs';

import styles from './index.module.scss';
import { useTrainingProject } from '../context';
import { Grid } from './grid';
import { Main } from './main';

export const TrainingProjectView: React.FC = observer(() => {
  const project = useTrainingProject();
  const tabs: Record<string, JSX.Element> = {
    main: <Main />,
    grid: <Grid />,
  };

  return (
    <div className={styles.project}>
      <div className={styles.actions}>
        <ul className={styles.modes}>
          <li
            onClick={() =>
              runInAction(() => {
                project.mode = 'main';
              })
            }
            className={clsx({
              [styles.active]: project.mode === 'main',
            })}
            title="Main"
            role="button"
          >
            <BsWrench />
          </li>
          <li
            onClick={() =>
              runInAction(() => {
                project.mode = 'grid';
              })
            }
            className={clsx({
              [styles.active]: project.mode === 'grid',
            })}
            title="Grid"
            role="button"
          >
            <BsGrid />
          </li>
        </ul>
      </div>
      {tabs[project.mode]}
    </div>
  );
});

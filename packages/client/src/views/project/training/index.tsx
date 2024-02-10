import React from 'react';
import { BsImage } from 'react-icons/bs';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Images } from './images';
import { useTraningProject } from '../context';

export const TrainingProjectView: React.FC = observer(() => {
  const project = useTraningProject();
  const tabs: Record<
    string,
    { title: string; icon: JSX.Element; children: JSX.Element }
  > = {
    images: {
      title: 'Images',
      icon: <BsImage />,
      children: <Images />,
    },
  };

  return (
    <div className={styles.project}>
      <ul className={styles.modes}>
        {Object.entries(tabs).map(([key, { icon, title }]) => (
          <li
            key={key}
            onClick={() =>
              runInAction(() => {
                project.mode = key;
              })
            }
            className={project.mode === key ? styles.active : undefined}
            title={title}
          >
            {icon}
          </li>
        ))}
      </ul>
      {tabs[project.mode].children}
    </div>
  );
});

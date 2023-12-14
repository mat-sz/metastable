import React from 'react';
import { BsGrid, BsImage, BsPencil } from 'react-icons/bs';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Images } from './images';
import { Grid } from './grid';
import { ImageEditor } from './editor';
import { mainStore } from '../../stores/MainStore';

export const Project: React.FC = observer(() => {
  const project = mainStore.project!;
  const tabs: Record<
    string,
    { title: string; icon: JSX.Element; children: JSX.Element }
  > = {
    images: {
      title: 'Images',
      icon: <BsImage />,
      children: <Images />,
    },
    grid: {
      title: 'Grid',
      icon: <BsGrid />,
      children: <Grid />,
    },
    editor: {
      title: 'Editor',
      icon: <BsPencil />,
      children: <ImageEditor />,
    },
  };

  return (
    <div className={styles.project}>
      <ul className={styles.categories}>
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

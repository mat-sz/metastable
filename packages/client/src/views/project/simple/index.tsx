import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsGrid, BsImage, BsPencil } from 'react-icons/bs';


import { ImageEditor } from './editor';
import { Grid } from './grid';
import { Images } from './images';
import styles from './index.module.scss';
import { useSimpleProject } from '../context';

export const SimpleProjectView: React.FC = observer(() => {
  const project = useSimpleProject();
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

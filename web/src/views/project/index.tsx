import React, { useState } from 'react';
import { BsGrid, BsImage, BsPencil } from 'react-icons/bs';

import styles from './index.module.scss';
import { Images } from './images';
import { Grid } from './grid';
import { ImageEditor } from './editor';

export const Project: React.FC = () => {
  const [tab, setTab] = useState('images');
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
            onClick={() => setTab(key)}
            className={tab === key ? styles.active : undefined}
            title={title}
          >
            {icon}
          </li>
        ))}
      </ul>
      {tabs[tab].children}
    </div>
  );
};

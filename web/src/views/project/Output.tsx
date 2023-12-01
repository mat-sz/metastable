import React, { useState } from 'react';

import styles from './Output.module.scss';
import { Preview } from './Preview';
import { Grid } from './Grid';

export const Output: React.FC = () => {
  const [tab, setTab] = useState('preview');
  const tabs: Record<string, { title: string; children: JSX.Element }> = {
    preview: {
      title: 'Preview',
      children: <Preview />,
    },
    grid: {
      title: 'Grid',
      children: <Grid />,
    },
  };

  return (
    <div className={styles.output}>
      <ul className={styles.categories}>
        {Object.entries(tabs).map(([key, { title }]) => (
          <li
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? styles.active : undefined}
          >
            {title}
          </li>
        ))}
      </ul>
      {tabs[tab].children}
    </div>
  );
};

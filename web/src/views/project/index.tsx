import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { Preview } from './Preview';
import { mainStore } from '../../stores/MainStore';

export const Project: React.FC = observer(() => {
  if (!mainStore.project) {
    return <div className={styles.project}></div>;
  }

  return (
    <div className={styles.project}>
      <Preview />
      <Prompt />
    </div>
  );
});

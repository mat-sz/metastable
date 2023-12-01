import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Prompt } from './Prompt';
import { mainStore } from '../../stores/MainStore';
import { Output } from './Output';

export const Project: React.FC = observer(() => {
  if (!mainStore.project) {
    return <div className={styles.project}></div>;
  }

  return (
    <div className={styles.project}>
      <Output />
      <Prompt />
    </div>
  );
});

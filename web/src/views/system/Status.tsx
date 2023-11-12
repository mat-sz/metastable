import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Status.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Status: React.FC = observer(() => {
  return (
    <div className={styles.status}>
      <div>Queued images: {mainStore.remaining}</div>
      {mainStore.progressValue < mainStore.progressMax && (
        <progress value={mainStore.progressValue} max={mainStore.progressMax} />
      )}
    </div>
  );
});

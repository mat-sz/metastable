import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Status.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Status: React.FC = observer(() => {
  return (
    <div className={styles.status}>
      <div>Queued images: {mainStore.promptRemaining}</div>
      {mainStore.promptValue < mainStore.promptMax && (
        <progress value={mainStore.promptValue} max={mainStore.promptMax} />
      )}
      <div>Queued downloads: {mainStore.downloads.remaining}</div>
    </div>
  );
});

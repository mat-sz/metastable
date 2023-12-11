import React from 'react';
import { BsDownload, BsImage } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import styles from './Status.module.scss';
import { mainStore } from '../../stores/MainStore';
import { ProgressButton } from '../../components/ProgressButton';

export const Status: React.FC = observer(() => {
  return (
    <div className={styles.status}>
      <div className={styles.progress}>
        <ProgressButton
          value={mainStore.promptValue}
          max={mainStore.promptMax}
          marquee={mainStore.promptRemaining > 0}
        >
          <BsImage />
          <span>Queued images: {mainStore.promptRemaining}</span>
        </ProgressButton>
        <ProgressButton
          value={
            mainStore.downloads.queue.length - mainStore.downloads.remaining
          }
          max={mainStore.downloads.queue.length}
          onClick={() => mainStore.downloads.open()}
        >
          <BsDownload />
          <span>Queued downloads: {mainStore.downloads.remaining}</span>
        </ProgressButton>
      </div>
    </div>
  );
});

import React from 'react';
import { BsDownload, BsImage } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import styles from './Header.module.scss';
import { mainStore } from '../../stores/MainStore';
import { ProgressButton } from '../../components/ProgressButton';

export const Header: React.FC = observer(() => {
  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <h1>Metastable UI</h1>
      </div>
      <div className={styles.menu}>
        {!!mainStore.project && (
          <>
            <button onClick={() => mainStore.project?.save()}>Save</button>
          </>
        )}
      </div>
      <div>
        <ProgressButton value={mainStore.promptValue} max={mainStore.promptMax}>
          <BsImage />
          <span>Queued images: {mainStore.promptRemaining}</span>
        </ProgressButton>
      </div>
      <div>
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

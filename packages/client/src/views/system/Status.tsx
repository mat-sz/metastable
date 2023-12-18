import React from 'react';
import {
  BsDownload,
  BsFillCheckCircleFill,
  BsFillExclamationCircleFill,
  BsFillQuestionCircleFill,
  BsGpuCard,
  BsImage,
} from 'react-icons/bs';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import styles from './Status.module.scss';
import { mainStore } from '../../stores/MainStore';
import { ProgressButton } from '../../components';
import { useUI } from '../../contexts/ui';
import { Backend } from '../../modals/backend';
import { DownloadManager } from '../../modals/download';

export const Status: React.FC = observer(() => {
  const status = mainStore.status;
  const { showModal } = useUI();

  return (
    <div className={styles.status}>
      <div className={styles.progress}>
        <button
          onClick={() => showModal(<Backend />)}
          className={clsx({
            [styles.error]: status === 'error',
            [styles.waiting]: status === 'starting' || status === 'connecting',
            [styles.ready]: status === 'ready',
          })}
        >
          {status === 'error' && <BsFillExclamationCircleFill />}
          {(status === 'starting' || status === 'connecting') && (
            <BsFillQuestionCircleFill />
          )}
          {status === 'ready' && <BsFillCheckCircleFill />}
          <span>Status: {status}</span>
        </button>
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
          onClick={() => showModal(<DownloadManager />)}
        >
          <BsDownload />
          <span>Queued downloads: {mainStore.downloads.remaining}</span>
        </ProgressButton>
      </div>
      <div className={styles.info}>
        <div>
          <BsGpuCard />
          {status === 'ready' ? (
            <span>{mainStore.torchInfo?.device?.name}</span>
          ) : (
            <span>(Unknown)</span>
          )}
        </div>
      </div>
    </div>
  );
});

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
import { TaskState } from '@metastable/types';

import styles from './Status.module.scss';
import { mainStore } from '../../stores/MainStore';
import { ProgressButton } from '../../components';
import { useUI } from '../../contexts/ui';
import { Backend } from '../../modals/backend';
import { DownloadManager } from '../../modals/download';

export const Status: React.FC = observer(() => {
  const status = mainStore.status;
  const { showModal } = useUI();

  const downloads = mainStore.tasks.downloads;
  const count = downloads.filter(
    item =>
      item.state === TaskState.SUCCESS ||
      item.state === TaskState.RUNNING ||
      item.state === TaskState.PREPARING ||
      item.state === TaskState.QUEUED,
  ).length;
  const remaining = downloads.filter(
    item => item.state !== TaskState.SUCCESS,
  ).length;

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
          value={remaining}
          max={count}
          onClick={() => showModal(<DownloadManager />)}
        >
          <BsDownload />
          <span>Queued downloads: {remaining}</span>
        </ProgressButton>
      </div>
      <div className={styles.info}>
        <div>
          <BsGpuCard />
          <span>{mainStore.deviceName}</span>
        </div>
      </div>
    </div>
  );
});

import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  BsFillCheckCircleFill,
  BsFillExclamationCircleFill,
  BsFillQuestionCircleFill,
  BsGpuCard,
  BsPcDisplayHorizontal,
} from 'react-icons/bs';

import { LogoIcon } from '$components/logoIcon';
import { mainStore } from '$stores/MainStore';
import { uiStore } from '$stores/UIStore';
import styles from './Status.module.scss';

interface Props {
  className?: string;
}

export const Status: React.FC<Props> = observer(({ className }) => {
  const status = mainStore.status;

  return (
    <div className={clsx(styles.status, className)}>
      <div className={styles.progress}>
        <div
          className={clsx(styles.backendStatus, {
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
        </div>
      </div>
      <div className={styles.info}>
        <button
          onClick={e => {
            e.stopPropagation();
            uiStore.toggleSystemMonitor();
          }}
        >
          <BsPcDisplayHorizontal />
          <span>System monitor</span>
        </button>
        <div>
          <BsGpuCard />
          <span>{mainStore.deviceName}</span>
        </div>
        <div>
          <LogoIcon />
          <span>
            {__APP_NAME__} {__APP_VERSION__}
          </span>
        </div>
      </div>
    </div>
  );
});

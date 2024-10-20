import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsFillCheckCircleFill,
  BsFillExclamationCircleFill,
  BsFillQuestionCircleFill,
  BsGpuCard,
} from 'react-icons/bs';

import { mainStore } from '$stores/MainStore';
import styles from './Status.module.scss';
import { Utilization } from './Utilization';

interface Props {
  className?: string;
}

export const Status: React.FC<Props> = observer(({ className }) => {
  const status = mainStore.status;
  const [showUtilization, setShowUtilization] = useState(false);

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
            setShowUtilization(current => !current);
          }}
        >
          <BsGpuCard />
          <span>{mainStore.deviceName}</span>
        </button>
        {showUtilization && <Utilization />}
      </div>
    </div>
  );
});

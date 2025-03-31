import clsx from 'clsx';
import React from 'react';
import {
  BsFillCheckCircleFill,
  BsFillExclamationCircleFill,
  BsFillQuestionCircleFill,
  BsPcDisplayHorizontal,
} from 'react-icons/bs';

import { Button } from '$components/button';
import { LogoIcon } from '$components/logoIcon';
import { useModalCondition } from '$hooks/useModal';
import { InstanceBackendError } from '$modals/instance/backendError';
import { useStatus } from '$store/backend/hooks';
import { useUIStore } from '$store/ui';
import styles from './Status.module.scss';

interface Props {
  className?: string;
}

export const Status: React.FC<Props> = ({ className }) => {
  const status = useStatus();
  const toggleSystemMonitor = useUIStore(state => state.toggleSystemMonitor);

  const isError = status === 'error';
  useModalCondition(<InstanceBackendError />, () => isError, [isError]);

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
        <Button
          onClick={e => {
            e.stopPropagation();
            toggleSystemMonitor();
          }}
          icon={<BsPcDisplayHorizontal />}
        >
          System monitor
        </Button>
        <Button href="https://metastable.studio/" icon={<LogoIcon />}>
          {__APP_NAME__} {__APP_VERSION__}
        </Button>
      </div>
    </div>
  );
};

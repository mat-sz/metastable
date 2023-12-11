import React from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';

export const Backend: React.FC = observer(() => {
  return (
    <Modal
      title="Backend status"
      isOpen={mainStore.modal === 'backend'}
      onClose={() => (mainStore.modal = undefined)}
    >
      <div className={styles.log}>
        {mainStore.backendLog.map((item, i) => (
          <div
            key={i}
            className={clsx({ [styles.error]: item.type === 'stderr' })}
          >
            <span className={styles.timestamp}>
              [{new Date(item.timestamp).toLocaleTimeString()}]
            </span>
            <span className={styles.text}>{item.text}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
});

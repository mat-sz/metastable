import React from 'react';
import { BsArrowRepeat } from 'react-icons/bs';

import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

export const ConnectionError: React.FC = () => {
  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Connection error</h2>
        <div>
          Unable to retrieve bundle information. Please check your internet
          connection and try again.
        </div>
      </div>
      <div className={styles.footer}>
        <button
          className={styles.cta}
          onClick={() => mainStore.checkForUpdates()}
        >
          <span>Refresh</span>
          <BsArrowRepeat />
        </button>
      </div>
    </div>
  );
};

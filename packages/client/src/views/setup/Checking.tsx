import React from 'react';

import { Loading } from '$components/loading';
import styles from './index.module.scss';

export const Checking: React.FC = () => {
  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Verifying compatibility...</h2>
      </div>
      <Loading />
    </div>
  );
};

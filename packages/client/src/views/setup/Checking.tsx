import { observer } from 'mobx-react-lite';
import React from 'react';

import { Loading } from '$components/loading';
import styles from './index.module.scss';

export const Checking: React.FC = observer(() => {
  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Verifying compatibility...</h2>
      </div>
      <Loading />
    </div>
  );
});

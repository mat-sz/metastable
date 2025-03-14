import React from 'react';
import { BsArrowRepeat } from 'react-icons/bs';

import { Button } from '$components/button';
import { useUpdateStore } from '$store/update';
import styles from './index.module.scss';

export const ConnectionError: React.FC = () => {
  const refresh = useUpdateStore(state => state.refresh);

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
        <Button onClick={refresh} icon={<BsArrowRepeat />}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

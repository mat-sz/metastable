import { observer } from 'mobx-react-lite';
import React from 'react';

import styles from './index.module.scss';

export const ConnectionError: React.FC = observer(() => {
  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Connection error</h2>
        <div>
          Unable to retrieve bundle information. Please check your internet
          connection and try again.
        </div>
      </div>
    </div>
  );
});

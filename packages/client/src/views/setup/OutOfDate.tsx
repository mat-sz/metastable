import React from 'react';

import { Link } from '$components/link';
import styles from './index.module.scss';

export const OutOfDate: React.FC = () => {
  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Installer out-of-date</h2>
        <div>
          Please download the latest version from{' '}
          <Link href="https://metastable.studio">
            https://metastable.studio
          </Link>{' '}
          and try again.
        </div>
      </div>
    </div>
  );
};

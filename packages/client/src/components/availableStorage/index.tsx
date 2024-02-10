import React from 'react';

import { filesize } from '@utils/file';
import styles from './index.module.scss';

interface Props {
  path?: string;
  total: number;
  free: number;
}

export const AvailableStorage: React.FC<Props> = ({ path, total, free }) => {
  const used = total - free;
  const humanUsed = filesize(used);
  const humanTotal = filesize(total);
  const humanFree = filesize(free);

  return (
    <div className={styles.storage}>
      <div className={styles.info}>
        <div>{path}</div>
        <div>
          {humanUsed} of {humanTotal} used
        </div>
      </div>
      <div className={styles.bar}>
        <div
          className={styles.used}
          style={{ width: `${(used / total) * 100}%` }}
        >
          {humanUsed}
        </div>
        <div
          className={styles.free}
          style={{ width: `${(free / total) * 100}%` }}
        >
          {humanFree}
        </div>
      </div>
    </div>
  );
};

import { observer } from 'mobx-react-lite';
import React from 'react';

import styles from './index.module.scss';

interface Props {
  value: number;
  max: number;
}

export const ProgressCircle: React.FC<React.PropsWithChildren<Props>> =
  observer(({ value, max }) => {
    const progress = value / max;

    return (
      <div
        className={styles.progressCircle}
        style={{
          background: `conic-gradient(var(--progress-fg) ${
            progress * 360
          }deg, var(--progress-bg) 0deg)`,
        }}
      >
        <div className={styles.progress}>{Math.floor(progress * 100)}%</div>
      </div>
    );
  });

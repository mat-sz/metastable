import { observer } from 'mobx-react-lite';
import React from 'react';

import styles from './index.module.scss';

interface Props {
  value: number;
  max: number;
  hideText?: boolean;
}

export const ProgressCircle: React.FC<React.PropsWithChildren<Props>> =
  observer(({ value, max, hideText }) => {
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
        {!hideText && (
          <div className={styles.progress}>{Math.floor(progress * 100)}%</div>
        )}
      </div>
    );
  });

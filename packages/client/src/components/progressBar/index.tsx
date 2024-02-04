import React from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';

export interface ProgressBarProps {
  className?: string;
  value?: number;
  max?: number;
  marquee?: boolean;
}

export const ProgressBar: React.FC<
  React.PropsWithChildren<ProgressBarProps>
> = ({ className, value = 0, max = 0, marquee = false, children }) => {
  return (
    <div
      className={clsx(
        styles.progress,
        { [styles.marquee]: marquee && value >= max },
        className,
      )}
    >
      <div className={styles.progressInfo}>{children}</div>
      <div
        className={styles.progressBar}
        style={
          typeof value !== 'undefined' && typeof max !== 'undefined'
            ? { width: `${(value * 100) / max}%` }
            : {}
        }
      />
    </div>
  );
};

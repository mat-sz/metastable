import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

export interface ProgressButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  value?: number;
  max?: number;
  marquee?: boolean;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  children,
  className,
  value = 0,
  max = 0,
  marquee = false,
  ...props
}) => {
  return (
    <button
      className={clsx(
        styles.progressButton,
        { [styles.marquee]: marquee && value >= max },
        className,
      )}
      {...props}
    >
      {value < max && (
        <div
          className={styles.progress}
          style={{ width: `${(value * 100) / max}%` }}
        />
      )}
      {children}
    </button>
  );
};

import React from 'react';
import clsx from 'clsx';

import styles from './ProgressButton.module.scss';

export interface ProgressButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  value?: number;
  max?: number;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  children,
  className,
  value = 0,
  max = 0,
  ...props
}) => {
  return (
    <button className={clsx(styles.progressButton, className)} {...props}>
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

import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

export interface LabelProps {
  label: React.ReactNode;
  className?: string;
  required?: boolean;
}

export const Label: React.FC<React.PropsWithChildren<LabelProps>> = ({
  label,
  className,
  required,
  children,
}) => {
  return (
    <label className={clsx(styles.label, className)}>
      <div className={styles.title}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </div>
      <div>{children}</div>
    </label>
  );
};

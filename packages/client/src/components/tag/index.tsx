import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

interface TagProps {
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error';
}

export const Tag: React.FC<React.PropsWithChildren<TagProps>> = ({
  icon,
  children,
  variant = 'default',
}) => {
  return (
    <div className={clsx(styles.tag, styles[variant])}>
      {icon}
      {!!children && <span>{children}</span>}
    </div>
  );
};

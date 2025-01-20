import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

interface LoadingProps {
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={clsx(styles.loading, className)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

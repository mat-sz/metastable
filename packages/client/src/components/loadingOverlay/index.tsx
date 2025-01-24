import clsx from 'clsx';
import React from 'react';

import { Loading } from '$components/loading';
import styles from './index.module.scss';

interface LoadingOverlayProps {
  className?: string;
  hideBackground?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  className,
  hideBackground = false,
}) => {
  return (
    <div
      className={clsx(
        styles.wrapper,
        { [styles.background]: !hideBackground },
        className,
      )}
    >
      <Loading />
    </div>
  );
};

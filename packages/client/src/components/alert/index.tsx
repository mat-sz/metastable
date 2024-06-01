import clsx from 'clsx';
import React from 'react';
import {
  BsCheckCircleFill,
  BsExclamationTriangleFill,
  BsXCircleFill,
} from 'react-icons/bs';

import styles from './index.module.scss';

interface AlertProps {
  variant: 'error' | 'warning' | 'ok';
  className?: string;
}

export const Alert: React.FC<React.PropsWithChildren<AlertProps>> = ({
  variant,
  className,
  children,
}) => {
  return (
    <div className={clsx(styles.alert, styles[variant], className)}>
      {variant === 'error' && <BsXCircleFill />}
      {variant === 'warning' && <BsExclamationTriangleFill />}
      {variant === 'ok' && <BsCheckCircleFill />}
      <span>{children}</span>
    </div>
  );
};

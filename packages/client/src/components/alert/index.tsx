import clsx from 'clsx';
import React from 'react';
import {
  BsCheckCircle,
  BsExclamationTriangle,
  BsXCircle,
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
      {variant === 'error' && <BsXCircle />}
      {variant === 'warning' && <BsExclamationTriangle />}
      {variant === 'ok' && <BsCheckCircle />}
      <span>{children}</span>
    </div>
  );
};

interface AlertsProps {
  className?: string;
}

export const Alerts: React.FC<React.PropsWithChildren<AlertsProps>> = ({
  className,
  children,
}) => {
  return <div className={clsx(styles.alerts, className)}>{children}</div>;
};

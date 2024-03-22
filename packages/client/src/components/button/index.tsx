import React from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';

export interface ButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  href?: string;
  download?: string;
  round?: boolean;
  variant?: 'danger' | 'primary' | 'secondary' | 'default';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  href,
  download,
  round,
  variant = 'default',
  ...props
}) => {
  if (href) {
    return (
      <a
        className={clsx(styles.button, styles[variant], className)}
        href={href}
        download={download}
        rel="noreferrer noopener"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

export interface ButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  href?: string;
  download?: string;
  variant?: 'danger' | 'primary' | 'secondary' | 'default';
  disabled?: boolean;
}

export const Button = React.forwardRef(
  (
    {
      icon,
      iconPosition = 'left',
      children,
      className,
      href,
      download,
      variant = 'default',
      ...props
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLElement | null>,
  ) => {
    const buttonClassName = clsx(
      styles.button,
      styles[variant],
      {
        [styles.iconLeft]: iconPosition === 'left' && icon,
        [styles.iconRight]: iconPosition === 'right' && icon,
      },
      className,
    );
    const contents = (
      <>
        {iconPosition === 'left' && icon}
        <span className={styles.text}>{children}</span>
        {iconPosition === 'right' && icon}
      </>
    );

    if (href) {
      return (
        <a
          className={buttonClassName}
          href={href}
          download={download}
          rel="noreferrer noopener"
          target="_blank"
          {...props}
          ref={ref as any}
        >
          {contents}
        </a>
      );
    }

    return (
      <button className={buttonClassName} {...props} ref={ref as any}>
        {contents}
      </button>
    );
  },
);

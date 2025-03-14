import clsx from 'clsx';
import React from 'react';
import { Link as WouterLink } from 'wouter';

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
  action?: string;
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
      action,
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
      const Component = href.startsWith('/') ? WouterLink : 'a';
      return (
        <Component
          className={buttonClassName}
          role="button"
          href={href}
          download={download}
          rel="noreferrer noopener"
          target="_blank"
          data-action={action}
          {...props}
          ref={ref as any}
        >
          {contents}
        </Component>
      );
    }

    return (
      <button
        className={buttonClassName}
        data-action={action}
        {...props}
        ref={ref as any}
      >
        {contents}
      </button>
    );
  },
);

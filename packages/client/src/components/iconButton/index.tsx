import clsx from 'clsx';
import React from 'react';
import { Link as WouterLink } from 'wouter';

import styles from './index.module.scss';

export interface IconButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  href?: string;
  download?: string;
  round?: boolean;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  className,
  href,
  download,
  round,
  disabled,
  ...props
}) => {
  const buttonClassName = clsx(
    styles.iconButton,
    { [styles.round]: round, [styles.disabled]: disabled },
    className,
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
        {...props}
      >
        {children}
      </Component>
    );
  }

  return (
    <button className={buttonClassName} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

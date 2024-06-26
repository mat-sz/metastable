import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

export interface IconButtonProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  href?: string;
  download?: string;
  round?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  className,
  href,
  download,
  round,
  ...props
}) => {
  if (href) {
    return (
      <a
        className={clsx(
          styles.iconButton,
          { [styles.round]: round },
          className,
        )}
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
      className={clsx(styles.iconButton, { [styles.round]: round }, className)}
      {...props}
    >
      {children}
    </button>
  );
};

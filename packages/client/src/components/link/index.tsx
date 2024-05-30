import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

export interface LinkProps
  extends Omit<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
    'ref'
  > {
  href?: string;
  download?: string;
}

export const Link: React.FC<LinkProps> = ({
  children,
  className,
  href,
  download,
  ...props
}) => {
  return (
    <a
      className={clsx(styles.link, className)}
      href={href}
      download={download}
      rel="noreferrer noopener"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
};

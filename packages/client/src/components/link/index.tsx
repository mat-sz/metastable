import clsx from 'clsx';
import React from 'react';
import { Link as WouterLink } from 'wouter';

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
  const Component = href?.startsWith('/') ? WouterLink : 'a';
  return (
    <Component
      className={clsx(styles.link, className)}
      href={href!}
      download={download}
      rel="noreferrer noopener"
      target="_blank"
      {...props}
    >
      {children}
    </Component>
  );
};

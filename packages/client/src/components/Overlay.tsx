import React, { HTMLAttributes } from 'react';
import clsx from 'clsx';

import styles from './Overlay.module.scss';

export interface OverlayProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {}

export const Overlay: React.FC<OverlayProps> = ({ className, ...props }) => {
  return <div className={clsx(styles.overlay, className)} {...props} />;
};

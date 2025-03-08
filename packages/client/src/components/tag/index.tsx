import clsx from 'clsx';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import styles from './index.module.scss';

interface TagProps {
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error';
  onDelete?: () => void;
}

export const Tag: React.FC<React.PropsWithChildren<TagProps>> = ({
  icon,
  children,
  variant = 'default',
  onDelete,
}) => {
  return (
    <div className={clsx(styles.tag, styles[variant])}>
      {icon}
      {!!children && <span>{children}</span>}
      {!!onDelete && (
        <IconButton onClick={onDelete}>
          <BsX />
        </IconButton>
      )}
    </div>
  );
};

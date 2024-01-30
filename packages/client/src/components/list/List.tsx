import React from 'react';
import clsx from 'clsx';

import styles from './List.module.scss';

interface ListProps {
  small?: boolean;
}

export const List: React.FC<React.PropsWithChildren<ListProps>> = ({
  children,
  small,
}) => {
  return (
    <div className={clsx(styles.list, { [styles.small]: small })}>
      {children}
    </div>
  );
};

import clsx from 'clsx';
import { CSSProperties, MouseEvent } from 'react';

import styles from './ContextMenuDivider.module.scss';

interface Props {
  className?: string;
  style?: CSSProperties;
}

export const ContextMenuDivider: React.FC<Props> = ({ className, style }) => {
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={clsx(styles.divider, className)}
      data-context-menu-divider
      onClick={onClick}
      style={style}
    />
  );
};

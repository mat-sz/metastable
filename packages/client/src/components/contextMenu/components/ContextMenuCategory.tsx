import clsx from 'clsx';
import { CSSProperties, MouseEvent, PropsWithChildren } from 'react';

import styles from './ContextMenuCategory.module.scss';

interface Props extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

export const ContextMenuCategory: React.FC<Props> = ({
  children,
  className,
  style,
}) => {
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={clsx(styles.category, className)}
      data-context-menu-category
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

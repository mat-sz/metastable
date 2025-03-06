import clsx from 'clsx';
import {
  CSSProperties,
  ReactNode,
  UIEvent,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import styles from './ContextMenuItem.module.scss';
import { ContextMenuContext } from '../ContextMenuContext';

interface Props {
  children: ReactNode;
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  dataTestState?: string;
  disabled?: boolean;
  onSelect?: (event: UIEvent) => void;
  style?: CSSProperties;
}

export const ContextMenuItem: React.FC<Props> = ({
  children,
  className,
  dataTestId,
  dataTestName = 'ContextMenuItem',
  dataTestState,
  disabled = false,
  onSelect,
  style,
}) => {
  const { registerMenuItem } = useContext(ContextMenuContext);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    registerMenuItem(ref.current!);
  }, [registerMenuItem]);

  const onClick = (event: UIEvent) => {
    if (event.defaultPrevented || disabled) {
      return;
    }

    if (onSelect) {
      onSelect(event);
    }
  };

  return (
    <div
      className={clsx(styles.item, className)}
      data-context-menu-item
      data-disabled={disabled}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      data-test-state={dataTestState}
      onClick={onClick}
      ref={ref}
      style={style}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  );
};

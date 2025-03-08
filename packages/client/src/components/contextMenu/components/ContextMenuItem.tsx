import clsx from 'clsx';
import {
  CSSProperties,
  ReactNode,
  UIEvent,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';
import { BsChevronRight } from 'react-icons/bs';

import styles from './ContextMenuItem.module.scss';
import { ContextMenuContext } from '../ContextMenuContext';

export interface ContextMenuItemProps {
  children: ReactNode;
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  dataTestState?: string;
  disabled?: boolean;
  onSelect?: (event: UIEvent) => void;
  onPointerOver?: (event: React.PointerEvent) => void;
  onBlur?: () => void;
  style?: CSSProperties;
  icon?: ReactNode;
  isSubmenu?: boolean;
  variant?: 'danger' | 'default';
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
  children,
  className,
  dataTestId,
  dataTestName = 'ContextMenuItem',
  dataTestState,
  disabled = false,
  onSelect,
  style,
  icon,
  onPointerOver,
  onBlur,
  isSubmenu,
  variant = 'default',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const selectedRef = useRef(false);

  const { focusItem, currentFocusId } = useContext(ContextMenuContext);

  useEffect(() => {
    if (currentFocusId !== id && selectedRef.current) {
      onBlur?.();
    }

    selectedRef.current = currentFocusId === id;
  }, [currentFocusId, onBlur]);

  const onClick = (event: UIEvent) => {
    if (event.defaultPrevented || disabled) {
      return;
    }

    if (onSelect) {
      onSelect(event);
    }
  };

  const wrappedOnPointerOver = (event: React.PointerEvent) => {
    if (event.defaultPrevented || disabled) {
      return;
    }

    focusItem(ref.current!);
    onPointerOver?.(event);
  };

  return (
    <div
      className={clsx(
        styles.item,
        styles[variant],
        { [styles.hasIcon]: !!icon },
        className,
      )}
      id={id}
      data-context-menu-item
      data-disabled={disabled}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      data-test-state={dataTestState}
      onClick={onClick}
      onPointerOver={wrappedOnPointerOver}
      ref={ref}
      style={style}
      tabIndex={disabled ? -1 : 0}
    >
      {icon}
      <span className={styles.text}>{children}</span>
      {isSubmenu && <BsChevronRight className={styles.chevron} />}
    </div>
  );
};

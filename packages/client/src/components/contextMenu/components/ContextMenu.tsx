import clsx from 'clsx';
import {
  CSSProperties,
  MouseEvent,
  ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './ContextMenu.module.scss';
import { ContextMenuContext } from '../ContextMenuContext';
import { useModalDismissSignal } from '../hooks/useModalDismissSignal';
import { AlignTo, ContextMenuStyle } from '../types';
import { calculateContextMenuStyle } from '../utils/calculateContextMenuStyle';

interface Props {
  alignTo: AlignTo;
  children: ReactNode;
  className?: string;
  clientX: number;
  clientY: number;
  targetRect: DOMRect;
  dataTestId?: string;
  dataTestName?: string;
  hide: () => void;
  style?: CSSProperties;
  isSubmenu?: boolean;
}

export const ContextMenu: React.FC<Props> = ({
  alignTo,
  children,
  className,
  clientX,
  clientY,
  targetRect,
  dataTestId,
  dataTestName = 'ContextMenu',
  hide,
  style: styleFromProps,
  isSubmenu,
}) => {
  const { contextMenuEvent, registerMenu } = useContext(ContextMenuContext);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    registerMenu(ref.current!);
  }, [registerMenu]);

  const styleRef = useRef<ContextMenuStyle>({
    left: 0,
    top: 0,
    width: undefined,
  });

  useModalDismissSignal(ref, hide, true);

  const eventType = contextMenuEvent?.type;

  // Optimally position the popup within the viewport
  useLayoutEffect(() => {
    const contextMenu = ref.current!;
    const menuRect = contextMenu.getBoundingClientRect();

    const isKeyboardEvent = eventType?.startsWith('key');

    const { left, top, width } = calculateContextMenuStyle({
      alignTo,
      cursorX: isKeyboardEvent ? undefined : clientX,
      cursorY: isKeyboardEvent ? undefined : clientY,
      menuRect,
      targetRect,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    });

    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    if (width) {
      contextMenu.style.width = `${width}px`;
    }

    // Stash in ref for subsequent renders
    styleRef.current = {
      left,
      top,
      width,
    };
  }, [alignTo, clientX, clientY, eventType, targetRect]);

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    hide();
  };

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const { left, top, width } = styleRef.current;

  let style: CSSProperties = {
    left: `${left}px`,
    top: `${top}px`,
    width: width ? `${width}px` : undefined,
  };

  if (styleFromProps) {
    style = Object.assign(style, styleFromProps);
  }

  const menu = (
    <div
      className={clsx(styles.contextMenu, className)}
      data-context-menu
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      ref={ref}
      style={style}
      tabIndex={0}
    >
      {children}
    </div>
  );

  return createPortal(
    isSubmenu ? (
      menu
    ) : (
      <div
        className={styles.backdrop}
        onClick={onClick}
        onPointerMove={stopPropagation}
      >
        {menu}
      </div>
    ),
    document.body,
  );
};

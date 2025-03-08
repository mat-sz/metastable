import clsx from 'clsx';
import {
  CSSProperties,
  forwardRef,
  MouseEvent,
  ReactNode,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './PopoverContainer.module.scss';
import { useModalDismissSignal } from '../hooks/useModalDismissSignal';
import { usePopoverContext } from '../PopoverContext';
import { PopoverOptions, PopoverStyle } from '../types';
import { calculatePopoverStyle } from '../utils/calculatePopoverStyle';

interface Props extends Omit<PopoverOptions, 'onHide' | 'onShow'> {
  children: ReactNode;
  x?: number;
  y?: number;
  targetRect: DOMRect;
  hide: () => void;
}

export const PopoverContainer = forwardRef<HTMLDivElement, Props>(
  (
    {
      alignTo = 'below',
      children,
      className,
      x,
      y,
      targetRect,
      dataTestId,
      dataTestName = 'Popover',
      hide,
      style: styleFromProps,
      noBackdrop,
    },
    forwardedRef,
  ) => {
    const { parentElementRef } = usePopoverContext();
    const ref = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);

    const styleRef = useRef<PopoverStyle>({
      left: 0,
      top: 0,
    });

    useModalDismissSignal(ref, hide);

    // Optimally position the popup within the viewport
    useLayoutEffect(() => {
      const element = ref.current!;
      const popoverRect = element.getBoundingClientRect();

      const { left, top, width } = calculatePopoverStyle({
        alignTo,
        x,
        y,
        popoverRect,
        targetRect,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });

      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      if (width) {
        element.style.width = `${width}px`;
      }

      // Stash in ref for subsequent renders
      styleRef.current = {
        left,
        top,
        width,
      };
    }, [alignTo, x, y, targetRect]);

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

    const { left, top, width, height } = styleRef.current;

    let style: CSSProperties = {
      left: `${left}px`,
      top: `${top}px`,
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    };

    if (styleFromProps) {
      style = Object.assign(style, styleFromProps);
    }

    const popover = (
      <div
        className={clsx(styles.popover, className)}
        data-test-id={dataTestId}
        data-test-name={dataTestName}
        ref={ref}
        style={style}
        tabIndex={0}
      >
        {children}
      </div>
    );

    const parent = parentElementRef?.current ?? document.body;
    return createPortal(
      noBackdrop ? (
        popover
      ) : (
        <div
          className={styles.backdrop}
          onClick={onClick}
          onContextMenu={onClick}
          onPointerMove={stopPropagation}
        >
          {popover}
        </div>
      ),
      parent,
    );
  },
);

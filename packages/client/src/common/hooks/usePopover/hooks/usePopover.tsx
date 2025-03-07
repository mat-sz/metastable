import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { isEvent, isMouseEvent } from '$utils/typed';
import { PopoverContainer } from '../components/PopoverContainer';
import { PopoverOptions, PopoverShowOptions } from '../types';

interface State {
  x?: number;
  y?: number;
  event?: React.SyntheticEvent;
  target: HTMLElement;
  targetRect: DOMRect;
}

export function usePopover(
  children: ReactNode,
  options: PopoverOptions = {},
): {
  popover?: ReactNode;
  hide: () => void;
  show: (options: PopoverShowOptions) => void;
  popoverRef: React.RefObject<HTMLDivElement | undefined>;
  isOpen: boolean;
  onClick: (event: React.SyntheticEvent) => void;
} {
  const { alignTo = 'below', onHide, onShow, ...props } = options;

  const popoverRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>();

  const hide = useCallback(() => setState(undefined), [setState]);

  useEffect(() => {
    const { onShow, onHide } = committedValuesRef.current;
    if (!state) {
      onHide?.();
      return;
    }

    const target = state.target;
    const popover = popoverRef.current as HTMLDivElement;

    target.blur();
    popover.focus();
    onShow?.(state.event);

    return () => {
      // Return focus to the target element that triggered the context menu.
      target.focus();
    };
  }, [state]);

  const committedValuesRef = useRef<{
    onHide?: () => void | Promise<void>;
    onShow?: (event?: React.SyntheticEvent) => void | Promise<void>;
    state?: State;
  }>({ onHide, onShow, state });

  useEffect(() => {
    committedValuesRef.current.onHide = onHide;
    committedValuesRef.current.onShow = onShow;
    committedValuesRef.current.state = state;
  });

  const show = useCallback(
    (options: PopoverShowOptions) => {
      let positioningTarget;
      let x;
      let y;
      let event;

      if (isEvent(options.positioningTarget)) {
        event = options.positioningTarget;

        if (event.defaultPrevented) {
          // Support nested context menus
          return;
        }

        event.preventDefault();
        positioningTarget = event.currentTarget as HTMLElement | undefined;
        if (!positioningTarget) {
          return;
        }

        if (isMouseEvent(event)) {
          x = event.clientX;
          y = event.clientY;
        }
      } else {
        positioningTarget = options.positioningTarget;
      }

      const focusTarget = options.focusTarget ?? positioningTarget;
      const targetRect = positioningTarget.getBoundingClientRect();

      setState({
        x,
        y,
        event,
        target: focusTarget,
        targetRect,
      });
    },
    [setState],
  );

  const onClick = useCallback(
    (event: React.SyntheticEvent) => {
      if (!children) {
        return;
      }

      event.stopPropagation();
      show({
        positioningTarget: event,
      });
    },
    [show, children],
  );

  let popover;
  if (state) {
    popover = (
      <PopoverContainer
        alignTo={alignTo}
        x={state.x}
        y={state.y}
        hide={hide}
        targetRect={state.targetRect}
        ref={popoverRef}
        {...props}
      >
        {children}
      </PopoverContainer>
    );
  }

  return {
    popover,
    show,
    hide,
    onClick,
    popoverRef,
    isOpen: !!state,
  };
}

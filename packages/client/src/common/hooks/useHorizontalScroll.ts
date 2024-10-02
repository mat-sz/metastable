import { useCallback, useRef } from 'react';

type HorizontalScrollTarget = (
  elementOrNode: HTMLElement | null,
) => HTMLElement | null;

const DEFAULT_SPEED = 90;
const DEFAULT_SMOOTH = 6;

export function useHorizontalScroll() {
  const targetRef = useRef<HTMLElement>();
  const stateRef = useRef({
    moving: false,
    scrollTarget: 0,
    scrollPos: 0,
    speed: DEFAULT_SPEED,
    smooth: DEFAULT_SMOOTH,
  });

  const updatePosition = useCallback(() => {
    const state = stateRef.current;
    const target = targetRef.current;
    if (!target || !state.moving) {
      return;
    }

    const distance = state.scrollTarget - state.scrollPos;
    const delta = distance / state.smooth;
    state.scrollPos += delta;
    target.scrollLeft = state.scrollPos;

    if (Math.abs(distance) <= 2) {
      state.moving = false;
      state.scrollPos = state.scrollTarget;
    } else {
      requestAnimationFrame(updatePosition);
    }
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const state = stateRef.current;
      const target = targetRef.current;
      if (!target) {
        return;
      }

      const delta = e.deltaY / 120;
      state.scrollTarget = Math.max(
        Math.min(
          state.scrollTarget + delta * state.speed,
          target.scrollWidth - target.clientWidth,
        ),
        0,
      );

      if (!state.moving) {
        state.moving = true;
        updatePosition();
      }
    },
    [updatePosition],
  );

  const callback = useCallback<HorizontalScrollTarget>(
    el => {
      const oldEl = targetRef.current;
      if (oldEl) {
        oldEl.removeEventListener('wheel', onWheel, { passive: false } as any);
      }

      if (el) {
        targetRef.current = el;
        el.addEventListener('wheel', onWheel, { passive: false });
        stateRef.current = {
          moving: false,
          scrollTarget: el.scrollLeft,
          scrollPos: el.scrollLeft,
          speed: DEFAULT_SPEED,
          smooth: DEFAULT_SMOOTH,
        };
      }

      return el;
    },
    [onWheel],
  );

  return callback;
}

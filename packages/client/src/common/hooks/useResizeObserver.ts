import React, { useEffect, useRef } from 'react';

export function useResizeObserver(
  handler: () => void,
  ref: React.RefObject<HTMLElement>,
) {
  const savedHandler = useRef(handler);
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new ResizeObserver(() => {
      savedHandler.current();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

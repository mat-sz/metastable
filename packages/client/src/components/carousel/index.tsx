import React, { useCallback, useRef, useState } from 'react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

import { useEventListener } from '$hooks/useEventListener';
import { useResizeObserver } from '$hooks/useResizeObserver';
import styles from './index.module.scss';

export const Carousel: React.FC<React.PropsWithChildren> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBefore, setHasBefore] = useState(false);
  const [hasAfter, setHasAfter] = useState(false);

  const computeVisibility = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const threshold = 10;
    setHasBefore(el.scrollLeft > threshold);
    setHasAfter(el.scrollWidth - el.scrollLeft - el.clientWidth > threshold);
  }, [setHasBefore, setHasAfter]);

  useResizeObserver(computeVisibility, ref);
  useEventListener('scroll', computeVisibility, ref);

  return (
    <div className={styles.carousel}>
      <div className={styles.items} ref={ref}>
        {children}
      </div>
      {hasBefore && (
        <button
          className={styles.previous}
          onClick={() =>
            ref.current?.scrollBy({
              behavior: 'smooth',
              left: -1 * (ref.current?.clientWidth + 10),
            })
          }
        >
          <BsChevronLeft />
        </button>
      )}
      {hasAfter && (
        <button
          className={styles.next}
          onClick={() =>
            ref.current?.scrollBy({
              behavior: 'smooth',
              left: ref.current?.clientWidth + 10,
            })
          }
        >
          <BsChevronRight />
        </button>
      )}
    </div>
  );
};

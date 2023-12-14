import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import styles from './Carousel.module.scss';

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

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const resizeObserver = new ResizeObserver(computeVisibility);
    resizeObserver.observe(el);

    el.addEventListener('scroll', computeVisibility);
    computeVisibility();

    return () => {
      el.removeEventListener('scroll', computeVisibility);
      resizeObserver.disconnect();
    };
  }, [computeVisibility]);

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
          <FaChevronLeft />
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
          <FaChevronRight />
        </button>
      )}
    </div>
  );
};

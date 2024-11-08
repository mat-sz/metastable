import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import styles from './index.module.scss';

export interface SplitViewProps {
  children: JSX.Element[];
  className?: string;
  direction: 'vertical' | 'horizontal';
  sizes?: number[];
  onChange?: (sizes: number[]) => void;
  minSizes?: string[];
}

export const SplitView: React.FC<SplitViewProps> = ({
  className,
  direction,
  children,
  sizes,
  minSizes,
  onChange,
}) => {
  const [pointerState, setPointerState] = useState<{ index: number }>();

  const gridRef = useRef<HTMLDivElement>(null);
  const gridTemplateProperty =
    direction === 'horizontal' ? 'gridTemplateColumns' : 'gridTemplateRows';
  const gridTemplateValue = children
    .map(
      (_, i) =>
        `${i > 0 ? 'var(--gutter-size)' : ''} minmax(${minSizes?.[i] ?? 0}, ${sizes?.[i] ?? 1}fr) `,
    )
    .join(' ');

  useEffect(() => {
    if (!pointerState) {
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      const gridEl = gridRef.current;
      if (!gridEl) {
        return;
      }

      // TODO: Add support for more than two child elements.
      const rect = gridEl.getBoundingClientRect();
      const percent =
        (direction === 'horizontal'
          ? (e.clientX - rect.left) / rect.width
          : (e.clientY - rect.top) / rect.height) * 100;
      onChange?.([percent, 100 - percent]);
    };

    const onPointerUp = (e: PointerEvent) => {
      onPointerMove(e);
      setPointerState(undefined);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [pointerState, setPointerState, onChange]);

  return (
    <div
      className={clsx(styles.view, styles[direction], className)}
      style={{ [gridTemplateProperty]: gridTemplateValue }}
      ref={gridRef}
    >
      {children.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div
              className={styles.gutter}
              onPointerDown={e => {
                e.preventDefault();
                e.stopPropagation();
                setPointerState({ index: i });
              }}
            />
          )}
          {child}
        </React.Fragment>
      ))}
    </div>
  );
};

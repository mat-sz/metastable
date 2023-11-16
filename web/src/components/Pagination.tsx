import React from 'react';

import styles from './Pagination.module.scss';

export interface PaginationProps {
  current: number;
  max: number;
  onSelect: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  max,
  onSelect,
}) => {
  const pages: { i?: number; text: string }[] = [];

  let skipped = false;
  for (let i = 1; i <= max; i++) {
    if (i <= 3 || Math.abs(current - i) <= 1 || max - i < 3) {
      skipped = false;
      pages.push({ i, text: `${i}` });
    } else if (!skipped) {
      skipped = true;
      pages.push({ text: `...` });
    }
  }

  return (
    <div className={styles.pagination}>
      <button disabled={current === 1} onClick={() => onSelect(current - 1)}>
        Previous
      </button>
      {pages.map(({ i, text }, index) =>
        i ? (
          <button
            key={index}
            onClick={() => onSelect(i)}
            className={i === current ? styles.active : undefined}
          >
            {text}
          </button>
        ) : (
          <span key={index}>{text}</span>
        ),
      )}
      <button disabled={current >= max} onClick={() => onSelect(current + 1)}>
        Next
      </button>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { BsSearch, BsX } from 'react-icons/bs';

import styles from './index.module.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Search: React.FC<Props> = ({
  value,
  onChange,
  onKeyDown,
  autoFocus,
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  return (
    <label className={styles.search}>
      <BsSearch />
      <input
        ref={ref}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {!!value && (
        <button onClick={() => onChange('')}>
          <BsX />
        </button>
      )}
    </label>
  );
};

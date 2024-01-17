import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { BsSearch, BsX } from 'react-icons/bs';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const Search: React.FC<Props> = observer(({ value, onChange }) => {
  return (
    <label className={styles.search}>
      <BsSearch />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {!!value && (
        <button onClick={() => onChange('')}>
          <BsX />
        </button>
      )}
    </label>
  );
});

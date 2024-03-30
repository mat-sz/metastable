import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsChevronRight, BsHouseFill } from 'react-icons/bs';

import styles from './index.module.scss';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export const Breadcrumbs: React.FC<Props> = observer(({ value, onChange }) => {
  return (
    <div className={styles.breadcrumbs}>
      <button onClick={() => onChange([])}>
        <BsHouseFill />
      </button>
      {value.map((part, i) => (
        <React.Fragment key={i}>
          <BsChevronRight />
          <button onClick={() => onChange(value.slice(0, i + 1))}>
            {part}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
});

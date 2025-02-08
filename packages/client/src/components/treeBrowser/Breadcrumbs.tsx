import { TreeNode } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsChevronRight, BsHouseFill } from 'react-icons/bs';

import styles from './Breadcrumbs.module.scss';

interface Props {
  value: TreeNode[];
  onChange: (parentId?: string) => void;
}

export const Breadcrumbs: React.FC<Props> = observer(({ value, onChange }) => {
  return (
    <div className={styles.breadcrumbs}>
      <button onClick={() => onChange(undefined)}>
        <BsHouseFill />
      </button>
      {value.map(part => (
        <React.Fragment key={part.id}>
          <BsChevronRight />
          <button onClick={() => onChange(part.id)}>{part.name}</button>
        </React.Fragment>
      ))}
    </div>
  );
});

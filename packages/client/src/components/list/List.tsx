import { useState } from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';
import { Search } from '../search';

interface ListProps<T> {
  small?: boolean;
  items: T[];
  children: (item: T) => JSX.Element;
  quickFilter?: (data: T[], search: string) => T[];
}

export function List<T>({
  children,
  items,
  small,
  quickFilter,
}: ListProps<T>): JSX.Element {
  const [search, setSearch] = useState('');

  let displayItems = items;
  if (quickFilter && search) {
    displayItems = quickFilter(items, search);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.options}>
        <div>
          {!!quickFilter && <Search value={search} onChange={setSearch} />}
        </div>
      </div>
      <div
        className={clsx(styles.list, {
          [styles.small]: small,
        })}
      >
        {displayItems.map(children)}
      </div>
    </div>
  );
}

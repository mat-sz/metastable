import clsx from 'clsx';
import React, { useState } from 'react';
import { BsGrid, BsList, BsListUl } from 'react-icons/bs';

import styles from './index.module.scss';
import { Search } from '../search';
import { Switch, SwitchOption } from '../switch';

interface ListProps<T> {
  small?: boolean;
  items: T[];
  children: (item: T) => JSX.Element;
  quickFilter?: (data: T[], search: string) => T[];
  header?: React.ReactNode;
}

export function List<T>({
  header,
  children,
  items,
  small,
  quickFilter,
}: ListProps<T>): JSX.Element {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<string>('grid');

  let displayItems = items;
  if (quickFilter && search) {
    displayItems = quickFilter(items, search);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.options}>
        {!!header && <div>{header}</div>}
        <div>
          {!!quickFilter && <Search value={search} onChange={setSearch} />}
        </div>
        <Switch value={view} onChange={setView}>
          <SwitchOption value="grid">
            <BsGrid />
          </SwitchOption>
          <SwitchOption value="list">
            <BsListUl />
          </SwitchOption>
          <SwitchOption value="details">
            <BsList />
          </SwitchOption>
        </Switch>
      </div>
      <div
        className={clsx(styles.list, styles[`view_${view}`], {
          [styles.small]: small,
        })}
      >
        {displayItems.map(children)}
      </div>
    </div>
  );
}

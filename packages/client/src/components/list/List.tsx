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
  view?: string;
  searchAutoFocus?: boolean;
}

export function List<T>({
  header,
  children,
  items,
  small,
  quickFilter,
  view,
  searchAutoFocus,
}: ListProps<T>): JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedView, setSelectedView] = useState<string>('grid');

  let displayItems = items;
  if (quickFilter && search) {
    displayItems = quickFilter(items, search);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.options}>
        {!!header && <div>{header}</div>}
        <div>
          {!!quickFilter && (
            <Search
              value={search}
              onChange={setSearch}
              autoFocus={searchAutoFocus}
            />
          )}
        </div>
        {!view && (
          <Switch value={selectedView} onChange={setSelectedView}>
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
        )}
      </div>
      <div className={styles.listWrapper}>
        {displayItems.length ? (
          <div
            className={clsx(
              styles.list,
              styles[`view_${view || selectedView}`],
              {
                [styles.small]: small,
              },
            )}
          >
            {displayItems.map(children)}
          </div>
        ) : (
          <div className={styles.empty}>No results.</div>
        )}
      </div>
    </div>
  );
}

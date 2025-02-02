import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { BsGrid, BsList, BsListUl } from 'react-icons/bs';

import styles from './index.module.scss';
import { Search } from '../search';
import { Switch, SwitchOption } from '../switch';

export interface ListProps<T> {
  small?: boolean;
  items: T[];
  children: (item: T) => JSX.Element;
  noResultsView?: JSX.Element;
  quickFilter?: (data: T[], search: string) => T[];
  header?: React.ReactNode;
  view?: string;
  searchAutoFocus?: boolean;
}

export function List<T>({
  header,
  children,
  noResultsView,
  items,
  small,
  quickFilter,
  view,
  searchAutoFocus,
}: ListProps<T>): JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedView, setSelectedView] = useState<string>('grid');
  const listRef = useRef<HTMLDivElement>(null);

  let displayItems = items;
  if (quickFilter && search) {
    displayItems = quickFilter(items, search);
  }

  const getItems = () => {
    const listEl = listRef.current;
    if (!listEl) {
      return [];
    }

    return [...listEl.querySelectorAll(':scope > *[role="button"]')];
  };

  const getSelected = () => {
    return listRef.current?.querySelector(
      ':scope > *[role="button"][aria-selected="true"]',
    ) as HTMLElement | undefined;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.options}>
        {!!header && <div>{header}</div>}
        <div className={styles.search}>
          {!!quickFilter && (
            <Search
              value={search}
              onChange={setSearch}
              autoFocus={searchAutoFocus}
              onKeyDown={e => {
                switch (e.key) {
                  case 'Enter':
                    getSelected()?.click();
                    break;
                  case 'ArrowUp':
                  case 'ArrowDown':
                    {
                      const items = getItems();
                      const selected = getSelected();

                      let currentIndex = -1;
                      if (selected) {
                        currentIndex = [...items].findIndex(
                          el => el === selected,
                        );
                        selected.removeAttribute('aria-selected');
                      }

                      if (e.key === 'ArrowUp') {
                        currentIndex--;
                        if (currentIndex < 0) {
                          currentIndex = items.length - 1;
                        }
                      } else {
                        currentIndex++;
                        if (currentIndex >= items.length) {
                          currentIndex = -1;
                        }
                      }

                      const newSelected = items[currentIndex];
                      if (newSelected) {
                        newSelected.setAttribute('aria-selected', 'true');
                      }
                    }
                    break;
                }
              }}
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
            ref={listRef}
            onPointerMove={() => {
              const selected = getSelected();
              selected?.removeAttribute('aria-selected');
            }}
          >
            {displayItems.map(children)}
          </div>
        ) : (
          <div className={styles.empty}>{noResultsView ?? 'No results.'}</div>
        )}
      </div>
    </div>
  );
}

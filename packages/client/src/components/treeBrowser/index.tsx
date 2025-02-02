import clsx from 'clsx';
import React, { useState } from 'react';
import { BsFolder } from 'react-icons/bs';

import { Breadcrumbs } from '$components/breadcrumbs';
import { Card, CardProps, List } from '$components/list';
import styles from './index.module.scss';
import { TreeBrowserEntry } from './types';

interface CommonProps<TData, TItem = TreeBrowserEntry<TData>> {
  getCardProps?: (item: TItem) => CardProps;
  small?: boolean;
  view?: 'grid' | 'list' | 'details';
  onSelect: (item?: TItem) => void;
  noResultsView?: JSX.Element;
}

interface Props<TData, TItem = TreeBrowserEntry<TData>>
  extends CommonProps<TData> {
  defaultParts?: string[];
  getItems?: (parts: string[]) => TItem[];
  actions?: ((items: TItem[]) => React.ReactNode) | React.ReactNode;
  quickFilter?: (data: TItem[], parts: string[], search: string) => TItem[];
  showBreadcrumbs?: boolean;
  className?: string;
}

interface TreeBrowserListProps extends CommonProps<any> {
  items: TreeBrowserEntry<any>[];
  quickFilter?: (data: any[], search: string) => any[];
}

export const TreeBrowserList: React.FC<TreeBrowserListProps> = ({
  items,
  getCardProps,
  onSelect,
  ...props
}) => {
  return (
    <List items={items} searchAutoFocus={!!props.small} {...props}>
      {item =>
        item.type === 'group' ? (
          <Card
            key={item.id}
            onClick={() => onSelect(item)}
            icon={<BsFolder />}
            name={item.data}
          />
        ) : (
          <Card
            key={item.id}
            onClick={() => onSelect(item)}
            {...getCardProps?.(item)}
          />
        )
      }
    </List>
  );
};

export const TreeBrowser: React.FC<Props<any>> = ({
  getItems,
  onSelect,
  defaultParts = [],
  small = false,
  actions,
  quickFilter,
  showBreadcrumbs,
  className,
  ...props
}) => {
  const [parts, setParts] = useState<string[]>(defaultParts);
  const items = getItems?.(parts) || [];

  const onSelectItem = (item?: TreeBrowserEntry<any>) => {
    if (item?.type === 'group') {
      setParts([...item.parts]);
    } else {
      onSelect?.(item);
    }
  };

  return (
    <div
      className={clsx(styles.browser, { [styles.small]: small }, className)}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <div className={styles.header}>
        {showBreadcrumbs && <Breadcrumbs value={parts} onChange={setParts} />}
        <div className={styles.actions}>
          {typeof actions === 'function' ? actions(items) : actions}
        </div>
      </div>
      <TreeBrowserList
        items={items}
        onSelect={onSelectItem}
        quickFilter={
          quickFilter
            ? (data, search) => quickFilter?.(data, parts, search)
            : undefined
        }
        small={small}
        {...props}
      />
    </div>
  );
};

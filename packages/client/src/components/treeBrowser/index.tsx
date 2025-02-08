import { TreeNode } from '@metastable/types';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { BsFolder } from 'react-icons/bs';

import { Card, CardProps, List } from '$components/list';
import { Breadcrumbs } from './Breadcrumbs';
import { getAncestors, getDescendants } from './helpers';
import styles from './index.module.scss';

interface CommonProps<TNode extends TreeNode> {
  getCardProps?: (item: Extract<TNode, { nodeType: 'item' }>) => CardProps;
  small?: boolean;
  view?: 'grid' | 'list' | 'details';
  onSelect: (item?: Extract<TNode, { nodeType: 'item' }>) => void;
  noResultsView?: JSX.Element;
}

interface Props<TNode extends TreeNode> extends CommonProps<TNode> {
  defaultParentId?: string;
  nodes: TNode[];
  actions?: ((items: TNode[]) => React.ReactNode) | React.ReactNode;
  quickFilter?: (data: TNode[], search: string) => TNode[];
  showBreadcrumbs?: boolean;
  className?: string;
}

interface TreeBrowserListProps<TNode extends TreeNode>
  extends CommonProps<TNode> {
  items: TNode[];
  quickFilter?: (data: TNode[], search: string) => TNode[];
}

export const TreeBrowserList: React.FC<TreeBrowserListProps<any>> = ({
  items,
  getCardProps,
  onSelect,
  ...props
}) => {
  return (
    <List items={items} searchAutoFocus={!!props.small} {...props}>
      {item =>
        item.nodeType === 'group' ? (
          <Card
            key={item.id}
            onClick={() => onSelect(item)}
            icon={<BsFolder />}
            name={item.name}
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

export function TreeBrowser<TNode extends TreeNode>({
  nodes,
  onSelect,
  defaultParentId,
  small = false,
  actions,
  quickFilter,
  showBreadcrumbs,
  className,
  ...props
}: Props<TNode>): JSX.Element {
  const [parentId, setParentId] = useState(defaultParentId);
  const sorted = useMemo(() => {
    const currentNodes = [...nodes];
    currentNodes.sort((a, b) => {
      if (a.nodeType === 'group' && b.nodeType !== 'group') {
        return -1;
      }
      if (a.nodeType !== 'group' && b.nodeType === 'group') {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });
    return currentNodes;
  }, [nodes]);
  const items = useMemo(
    () => sorted.filter(node => node.parentId === parentId),
    [sorted, parentId],
  );
  const descendants = useMemo(
    () => getDescendants(sorted, parentId),
    [sorted, parentId],
  );
  const ancestors = useMemo(
    () => getAncestors(sorted, parentId),
    [sorted, parentId],
  );

  const onSelectItem = (item?: TNode) => {
    if (item?.nodeType === 'group') {
      setParentId(item.id);
    } else {
      onSelect?.(item as any);
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
        {showBreadcrumbs && (
          <Breadcrumbs value={ancestors} onChange={setParentId} />
        )}
        <div className={styles.actions}>
          {typeof actions === 'function' ? actions(items) : actions}
        </div>
      </div>
      <TreeBrowserList
        items={items}
        onSelect={onSelectItem}
        quickFilter={
          quickFilter
            ? (_, search) => quickFilter?.(descendants, search)
            : undefined
        }
        small={small}
        {...props}
      />
    </div>
  );
}

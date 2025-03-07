import { TreeNode } from '@metastable/types';

export function getAncestors<TItem extends TreeNode>(
  nodes: TItem[],
  parentId?: string,
): TItem[] {
  if (!parentId) {
    return [];
  }

  const result: TItem[] = [];
  let currentId: string | undefined = parentId;
  while (currentId) {
    const node = nodes.find(item => item.id === currentId);
    currentId = node?.parentId;
    if (node) {
      result.push(node);
    }
  }

  return result;
}

export function getChildren<TItem extends TreeNode>(
  nodes: TItem[],
  parentId?: string,
): TItem[] {
  return nodes.filter(node => node.parentId === parentId);
}

export function filterType<TItem extends TreeNode>(
  nodes: TItem[],
  nodeType: TreeNode['nodeType'],
): TItem[] {
  return nodes.filter(node => node.nodeType === nodeType);
}

export function getDescendants<TItem extends TreeNode>(
  nodes: TItem[],
  parentId?: string,
): TItem[] {
  if (!parentId) {
    return nodes;
  }

  const queue: TItem[] = [];
  const result: TItem[] = [];

  while (parentId) {
    const items = getChildren(nodes, parentId);
    queue.push(...filterType(items, 'group'));
    result.push(...items);
    parentId = queue.shift()?.id;
  }

  return result;
}

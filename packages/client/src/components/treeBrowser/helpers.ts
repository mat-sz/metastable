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

export function getDescendants<TItem extends TreeNode>(
  nodes: TItem[],
  parentId?: string,
): TItem[] {
  if (!parentId) {
    return nodes;
  }

  const items = nodes.filter(node => node.parentId === parentId);
  const queue = items.filter(node => node.nodeType === 'group');
  const result = items;

  while (queue.length) {
    const current = queue.shift()!;
    const items = nodes.filter(node => node.parentId === current.id);
    queue.push(...items.filter(node => node.nodeType === 'group'));
    result.push(...items);
  }

  return result;
}

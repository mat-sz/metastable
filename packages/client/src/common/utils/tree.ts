import { TreeNode } from '@metastable/types';

export function removeEmptyGroups<T extends TreeNode>(nodes: T[]): T[] {
  return nodes.filter(node => {
    if (node.nodeType === 'group') {
      return !!nodes.find(child => child.parentId === node.id);
    }

    return true;
  });
}

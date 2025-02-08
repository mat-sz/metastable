export interface TreeNode {
  id: string;
  parentId?: string;
  name: string;
  nodeType: 'group' | 'item';
}

export interface TreeItem extends TreeNode {
  nodeType: 'item';
}

export interface TreeGroup extends TreeNode {
  nodeType: 'group';
}

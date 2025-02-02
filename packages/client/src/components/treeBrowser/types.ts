export interface TreeBrowserEntryBase<TData> {
  id: string;
  type: 'group' | 'item';
  data: TData;
  parts: string[];
}

export interface TreeBrowserGroup<TData> extends TreeBrowserEntryBase<TData> {
  type: 'group';
}

export interface TreeBrowserItem<TData> extends TreeBrowserEntryBase<TData> {
  type: 'item';
}

export type TreeBrowserEntry<TData> =
  | TreeBrowserGroup<TData>
  | TreeBrowserItem<TData>;

import { arrayStartsWith } from '$utils/array';
import { TreeBrowserGroup, TreeBrowserItem } from './types';

export function listItems<TItem>(
  data: TItem[],
  getItemParts: (item: TItem) => string[] | undefined,
  parts: string[],
  includeSubgroups = false,
) {
  const entries: TItem[] = [];

  for (const entry of data) {
    const entryParts = getItemParts(entry) ?? [];
    if (!includeSubgroups && parts.length !== entryParts.length) {
      continue;
    }

    if (!arrayStartsWith(entryParts, parts)) {
      continue;
    }

    entries.push(entry);
  }

  return entries;
}

export function listGroups<TItem>(
  data: TItem[],
  getItemParts: (item: TItem) => string[] | undefined,
  parts: string[],
) {
  const set = new Set<string>();

  for (const entry of data) {
    const entryParts = getItemParts(entry) ?? [];
    if (
      entryParts.length !== parts.length + 1 ||
      !arrayStartsWith(entryParts, parts)
    ) {
      continue;
    }

    const first = entryParts[parts.length];
    if (first) {
      set.add(first);
    }
  }

  return [...set];
}

export function getItemsFactory<TItem>(
  data: TItem[],
  getId: (item: TItem) => string,
  getItemParts: (item: TItem) => string[] | undefined,
) {
  return (parts: string[]) => {
    return [
      ...listGroups(data, getItemParts, parts).map(dir => {
        const dirParts = [...parts, dir];

        return {
          id: `directory-${dirParts.join('-')}`,
          type: 'group',
          data: dir,
          parts: dirParts,
        } as TreeBrowserGroup<string>;
      }),
      ...listItems(data, getItemParts, parts, false).map(item => {
        return {
          id: getId(item),
          type: 'item',
          data: item,
        } as TreeBrowserItem<TItem>;
      }),
    ];
  };
}

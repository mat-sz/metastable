import React, { useContext } from 'react';

export const ListContext = React.createContext<{
  toggle(id: string): void;
  open?: string;
}>(undefined as any);

export function useListItem(id: string) {
  const context = useContext(ListContext);

  return {
    toggle: () => context.toggle(id),
    isOpen: context.open === id,
    shouldDarken: context.open && context.open !== id,
  };
}

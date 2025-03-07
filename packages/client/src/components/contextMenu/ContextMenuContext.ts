import { createContext } from 'react';

export type ContextMenuContextType = {
  focusItem: (element: HTMLDivElement) => void;
  currentFocusId: string | undefined;
  menuRef: React.RefObject<HTMLDivElement | undefined> | undefined;
};

export const ContextMenuContext = createContext<ContextMenuContextType>({
  focusItem: () => {},
  currentFocusId: undefined,
  menuRef: undefined,
});

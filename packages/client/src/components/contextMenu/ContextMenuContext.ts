import { createContext } from 'react';

export type ContextMenuContextType = {
  contextMenuEvent?: React.SyntheticEvent;
  registerMenu: (menuItem: HTMLDivElement) => void;
  focusItem: (element: HTMLDivElement) => void;
  currentFocusId: string | undefined;
  menuRef: React.MutableRefObject<HTMLDivElement | undefined> | undefined;
};

export const ContextMenuContext = createContext<ContextMenuContextType>({
  contextMenuEvent: undefined,
  registerMenu: () => {},
  focusItem: () => {},
  currentFocusId: undefined,
  menuRef: undefined,
});

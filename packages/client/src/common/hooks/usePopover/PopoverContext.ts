import React from 'react';

export interface IPopoverContext {
  parentElementRef?: React.RefObject<HTMLElement | null | undefined>;
}

export const PopoverContext = React.createContext<IPopoverContext>({});

export function usePopoverContext() {
  return React.useContext(PopoverContext);
}

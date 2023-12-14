import React from 'react';

export interface IUIContext {
  showModal(body: JSX.Element): void;
}

export const UIContext = React.createContext<IUIContext>(undefined as any);

export interface IModal {
  id: string;
  body: JSX.Element;
}

export function useUI() {
  return React.useContext(UIContext);
}

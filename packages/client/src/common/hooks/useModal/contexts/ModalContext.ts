import React from 'react';

export interface IModalContext {
  close(): void;
}

export const ModalContext = React.createContext<IModalContext>(
  undefined as any,
);

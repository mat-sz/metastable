import React from 'react';

export interface IModalWrapperContext {
  open(body: JSX.Element): void;
  open(id: string, body: JSX.Element): void;
  close(id: string): void;
}

export const ModalWrapperContext = React.createContext<IModalWrapperContext>(
  undefined as any,
);

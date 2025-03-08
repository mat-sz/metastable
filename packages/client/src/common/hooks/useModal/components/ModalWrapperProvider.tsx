import { nanoid } from 'nanoid';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { ModalContext } from '../contexts/ModalContext';
import {
  IModalWrapperContext,
  ModalWrapperContext,
} from '../contexts/ModalWrapperContext';

export interface IModal {
  id: string;
  body: JSX.Element;
}

export const ModalWrapperProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [modals, setModals] = useState<IModal[]>([]);

  const open = useCallback(
    (bodyOrId: string | JSX.Element, _body?: JSX.Element) => {
      const id = typeof bodyOrId === 'string' ? bodyOrId : nanoid();
      const body = _body ?? (bodyOrId as any);

      setModals(modals => [
        ...modals.filter(modal => modal.id !== id),
        { id, body },
      ]);
    },
    [setModals],
  );

  const close = useCallback(
    (id: string) => {
      setModals(modals => modals.filter(modal => modal.id !== id));
    },
    [setModals],
  );

  const context = useMemo<IModalWrapperContext>(
    () => ({
      open,
      close,
    }),
    [open, close],
  );

  return (
    <ModalWrapperContext.Provider value={context}>
      {children}
      {modals.map(({ body, id }) => (
        <ModalContext.Provider key={id} value={{ close: () => close(id) }}>
          {body}
        </ModalContext.Provider>
      ))}
    </ModalWrapperContext.Provider>
  );
};

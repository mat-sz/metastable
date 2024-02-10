import React, { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

import { IModal, IUIContext, UIContext, useUI } from './context';
import { ModalContext } from '@components/modal/context';

export const UI: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [modals, setModals] = useState<IModal[]>([]);

  const context: IUIContext = useMemo(
    () => ({
      showModal(body) {
        setModals(modals => [...modals, { id: nanoid(), body }]);
      },
    }),
    [setModals],
  );

  return (
    <UIContext.Provider value={context}>
      {children}
      {modals.map(({ body, id }) => (
        <ModalContext.Provider
          key={id}
          value={{
            close: () =>
              setModals(modals => modals.filter(modal => modal.id !== id)),
          }}
        >
          {body}
        </ModalContext.Provider>
      ))}
    </UIContext.Provider>
  );
};

export { useUI };

import { observer } from 'mobx-react-lite';
import React from 'react';

import { ModalContext } from '$components/modal/context';
import { modalStore } from '$stores/ModalStore';

export const UIWrapper: React.FC<React.PropsWithChildren> = observer(
  ({ children }) => {
    return (
      <>
        {children}
        {modalStore.modals.map(({ body, id }) => (
          <ModalContext.Provider
            key={id}
            value={{
              close: () => modalStore.close(id),
            }}
          >
            {body}
          </ModalContext.Provider>
        ))}
      </>
    );
  },
);

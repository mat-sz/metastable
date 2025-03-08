import React, { useCallback, useEffect, useRef } from 'react';

import { useModalContext } from '$hooks/useModal';
import { PopoverContext } from '$hooks/usePopover';
import styles from './Modal.module.scss';
import { ModalContainer } from './ModalContainer';
import { ModalProps } from './types';

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = props => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerInsideRef = useRef(false);
  const { close } = useModalContext();
  const wrappedClose = useCallback(() => {
    if (pointerInsideRef.current) {
      return;
    }

    close();
  }, [close]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, [wrappedClose]);

  return (
    <PopoverContext.Provider value={{ parentElementRef: dialogRef }}>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onPointerUp={() => {
          wrappedClose();
          pointerInsideRef.current = false;
        }}
        onClose={wrappedClose}
      >
        <ModalContainer
          {...props}
          onPointerDown={() => {
            pointerInsideRef.current = true;
          }}
          onClose={close}
        />
      </dialog>
    </PopoverContext.Provider>
  );
};

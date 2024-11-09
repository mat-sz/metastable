import clsx from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import { BsXLg } from 'react-icons/bs';

import { PopoverContext } from '$components/popover/context';
import { useModal } from './context';
import styles from './Modal.module.scss';

export interface ModalProps {
  title: string;
  size?: 'big' | 'small';
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  title,
  size = 'big',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerInsideRef = useRef(false);
  const { close } = useModal();
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
        <div
          className={clsx(styles.modal, styles[`modal_${size}`])}
          onPointerDown={() => {
            pointerInsideRef.current = true;
          }}
        >
          <div className={styles.title}>
            <span>{title}</span>
            <button onClick={close}>
              <BsXLg />
            </button>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      </dialog>
    </PopoverContext.Provider>
  );
};

export const ModalActions: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <div className={styles.actions}>{children}</div>;
};

import clsx from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import { BsXLg } from 'react-icons/bs';

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
    const dialogEl = dialogRef.current;
    if (!dialogEl) {
      return;
    }

    dialogEl.showModal();
    dialogEl.addEventListener('close', wrappedClose);

    return () => {
      dialogEl.removeEventListener('close', wrappedClose);
    };
  }, [wrappedClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onPointerUp={wrappedClose}
    >
      <div
        className={clsx(styles.modal, styles[`modal_${size}`])}
        onPointerDown={() => {
          pointerInsideRef.current = true;
        }}
        onPointerUp={e => {
          pointerInsideRef.current = false;
          e.stopPropagation();
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
  );
};

export const ModalActions: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <div className={styles.actions}>{children}</div>;
};

import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { BsXLg } from 'react-icons/bs';

import styles from './index.module.scss';
import { useModal } from './context';

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
  const { close } = useModal();

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) {
      return;
    }

    dialogEl.showModal();
    dialogEl.addEventListener('close', close);

    return () => {
      dialogEl.removeEventListener('close', close);
    };
  }, [close]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClick={close}>
      <div
        className={clsx(styles.modal, styles[`modal_${size}`])}
        onClick={e => e.stopPropagation()}
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

export { useModal };

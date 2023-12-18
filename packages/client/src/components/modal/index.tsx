import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { BsX } from 'react-icons/bs';

import styles from './index.module.scss';
import { useModal } from '../../contexts/modal';

export interface ModalProps {
  title: string;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  title,
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
      <div className={clsx(styles.modal)} onClick={e => e.stopPropagation()}>
        <div className={clsx(styles.title)}>
          <span>{title}</span>
          <button onClick={close}>
            <BsX />
          </button>
        </div>
        <div className={clsx(styles.body)}>{children}</div>
      </div>
    </dialog>
  );
};

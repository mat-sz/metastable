import React, { useEffect } from 'react';
import clsx from 'clsx';
import { BsX } from 'react-icons/bs';

import styles from './Modal.module.scss';
import { Portal } from './Portal.js';
import { Overlay } from './Overlay.js';
import { useModal } from '../contexts/modal.js';

export interface ModalProps {
  title: string;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  title,
}) => {
  const { close } = useModal();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <Portal isOpen>
      <Overlay onClick={close}>
        <div className={clsx(styles.modal)} onClick={e => e.stopPropagation()}>
          <div className={clsx(styles.title)}>
            <span>{title}</span>
            <button onClick={close}>
              <BsX />
            </button>
          </div>
          <div className={clsx(styles.body)}>{children}</div>
        </div>
      </Overlay>
    </Portal>
  );
};

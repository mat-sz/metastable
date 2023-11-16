import React, { useEffect } from 'react';
import clsx from 'clsx';
import { BsX } from 'react-icons/bs';

import styles from './Modal.module.scss';
import { Portal } from './Portal.js';
import { Overlay } from './Overlay.js';

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  title,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <Portal isOpen={isOpen}>
      <Overlay onClick={onClose}>
        <div className={clsx(styles.modal)} onClick={e => e.stopPropagation()}>
          <div className={clsx(styles.title)}>
            <span>{title}</span>
            <button onClick={onClose}>
              <BsX />
            </button>
          </div>
          <div className={clsx(styles.body)}>{children}</div>
        </div>
      </Overlay>
    </Portal>
  );
};

import clsx from 'clsx';
import React from 'react';
import { BsXLg } from 'react-icons/bs';

import styles from './Modal.module.scss';
import { ModalProps } from './types';

interface ModalContainerProps extends ModalProps {
  onClose?: () => void;
  onPointerDown?: () => void;
}

export const ModalContainer: React.FC<
  React.PropsWithChildren<ModalContainerProps>
> = ({ children, title, size = 'big', onClose, onPointerDown }) => {
  return (
    <div
      className={clsx(styles.modal, styles[`modal_${size}`])}
      onPointerDown={onPointerDown}
    >
      <div className={styles.title}>
        <span>{title}</span>
        {!!onClose && (
          <button onClick={onClose}>
            <BsXLg />
          </button>
        )}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

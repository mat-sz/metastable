import clsx from 'clsx';
import React, { useState } from 'react';
import { BsXLg } from 'react-icons/bs';

import { Alert } from '$components/alert';
import { formDataToObject } from '$utils/form';
import styles from './Modal.module.scss';
import { ModalProps } from './types';

interface ModalContainerProps extends ModalProps {
  onClose?: () => void;
  onPointerDown?: () => void;
}

export const ModalContainer: React.FC<
  React.PropsWithChildren<ModalContainerProps>
> = ({ children, title, size = 'big', onClose, onPointerDown, onSubmit }) => {
  const [error, setError] = useState<string>();

  return (
    <form
      className={clsx(styles.modal, styles[`modal_${size}`])}
      onPointerDown={onPointerDown}
      noValidate
      onSubmit={async e => {
        if (!(e.nativeEvent instanceof SubmitEvent)) {
          return;
        }

        const form = e.currentTarget;
        const submitter = e.nativeEvent.submitter as HTMLButtonElement;
        const action = submitter.value;

        e.preventDefault();
        e.stopPropagation();

        if (action === 'cancel') {
          onClose?.();
          return;
        }

        const isValid = form.checkValidity();
        if (!isValid) {
          const firstInvalidElement = form.querySelector(
            ':invalid',
          ) as HTMLElement | null;
          firstInvalidElement?.focus();
          return;
        }

        if (!onSubmit) {
          return;
        }

        const data = new FormData(e.currentTarget);
        try {
          await onSubmit?.(formDataToObject(data), action);
          onClose?.();
        } catch (e: any) {
          setError('message' in e ? (e.message as string) : `${e}`);
        }
      }}
    >
      <div className={styles.title}>
        <span>{title}</span>
        {!!onClose && (
          <button value="cancel">
            <BsXLg />
          </button>
        )}
      </div>
      <div className={styles.body}>
        {typeof error === 'string' && <Alert variant="error">{error}</Alert>}
        {children}
      </div>
    </form>
  );
};

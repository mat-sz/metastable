import React from 'react';

import { Button } from '$components/button';
import styles from './Modal.module.scss';

interface Props {
  hideCancel?: boolean;
  cancelText?: string;
}

export const ModalActions: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  hideCancel,
  cancelText = 'Cancel',
}) => {
  return (
    <div className={styles.actions}>
      {!hideCancel && (
        <Button variant="secondary" action="cancel">
          {cancelText}
        </Button>
      )}
      {children}
    </div>
  );
};

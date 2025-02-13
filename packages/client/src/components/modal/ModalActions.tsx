import React from 'react';

import styles from './Modal.module.scss';

export const ModalActions: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <div className={styles.actions}>{children}</div>;
};

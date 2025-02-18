import React from 'react';

import styles from './index.module.scss';

export const CardTags: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={styles.tags}>{children}</div>;
};

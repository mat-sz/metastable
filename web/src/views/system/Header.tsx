import React from 'react';

import styles from './Header.module.scss';

export const Header: React.FC = () => {
  return (
    <div className={styles.header}>
      <h1>Metastable UI</h1>
    </div>
  );
};

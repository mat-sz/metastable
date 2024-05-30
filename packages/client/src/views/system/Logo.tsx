import React from 'react';

import logo from '$/assets/logo.svg';
import styles from './Logo.module.scss';

export const Logo: React.FC = () => {
  return (
    <div className={styles.logo}>
      <img src={logo} alt="Logo" />
      <span>{import.meta.env.VITE_APP_NAME}</span>
    </div>
  );
};

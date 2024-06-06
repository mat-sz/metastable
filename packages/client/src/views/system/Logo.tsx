import React from 'react';

import logo from '$/assets/logo.svg';
import styles from './Logo.module.scss';

export const Logo: React.FC = () => {
  return (
    <div className={styles.logo}>
      <img src={logo} alt="Logo" />
      <span>{__APP_NAME__}</span>
    </div>
  );
};

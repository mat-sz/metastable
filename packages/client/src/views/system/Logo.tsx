import React from 'react';

import { LogoIcon } from '$components/logoIcon';
import styles from './Logo.module.scss';

export const Logo: React.FC = () => {
  return (
    <div className={styles.logo}>
      <LogoIcon />
    </div>
  );
};

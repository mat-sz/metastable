import React from 'react';

import { Controls } from './Controls';
import { Logo } from './Logo';
import styles from './TitleBar.module.scss';

export const TitleBar: React.FC = () => {
  return (
    <div className={styles.title}>
      <Logo />
      <Controls />
    </div>
  );
};

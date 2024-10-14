import React from 'react';

import { IS_ELECTRON, IS_MAC } from '$utils/config';
import { Controls } from './Controls';
import { Logo } from './Logo';
import styles from './TitleBar.module.scss';

export const TitleBar: React.FC = () => {
  return (
    <div className={styles.title}>
      {!(IS_ELECTRON && IS_MAC) && <Logo />}
      <Controls />
    </div>
  );
};

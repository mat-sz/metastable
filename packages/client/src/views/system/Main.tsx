import React from 'react';

import { useMediaQuery } from '$hooks/useMediaQuery';
import styles from './Main.module.scss';
import { Status } from './common/Status';

export const Main: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');

  return (
    <div className={styles.main}>
      {children}
      {isDesktop && <Status />}
    </div>
  );
};

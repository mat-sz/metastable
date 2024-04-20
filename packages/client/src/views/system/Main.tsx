import React from 'react';

import { useMediaQuery } from '$hooks/useMediaQuery';
import { Status } from './common/Status';
import styles from './Main.module.scss';

interface Props {
  hideStatus?: boolean;
}

export const Main: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  hideStatus,
}) => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');

  return (
    <div className={styles.main}>
      {children}
      {isDesktop && !hideStatus && <Status />}
    </div>
  );
};

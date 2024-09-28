import React from 'react';

import { useMediaQuery } from '$hooks/useMediaQuery';
import styles from './Main.module.scss';
import { Status } from './Status';
import { TabBar } from './TabBar';
import { TitleBar } from './TitleBar';

interface Props {
  isReady?: boolean;
}

export const Main: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  isReady,
}) => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');

  return (
    <div className={styles.main}>
      {isReady ? <TabBar /> : <TitleBar />}
      <div className={styles.wrapper}>{children}</div>
      {isDesktop && isReady && <Status />}
    </div>
  );
};

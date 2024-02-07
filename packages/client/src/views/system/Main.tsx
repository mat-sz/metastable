import React from 'react';

import styles from './Main.module.scss';
import { Header as DesktopHeader } from './desktop/Header';
import { Header as MobileHeader } from './mobile/Header';
import { Status } from './common/Status';
import { useMediaQuery } from '../../utils/useMediaQuery';

interface Props {
  showMenu?: boolean;
}

export const Main: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  showMenu,
}) => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');

  return (
    <div className={styles.main}>
      {isDesktop ? (
        <DesktopHeader showMenu={showMenu} />
      ) : (
        <MobileHeader showMenu={showMenu} />
      )}
      {children}
      {isDesktop && <Status />}
    </div>
  );
};

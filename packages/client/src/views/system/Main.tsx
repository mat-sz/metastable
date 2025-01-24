import { observer } from 'mobx-react-lite';
import React from 'react';

import { LoadingOverlay } from '$components/loadingOverlay';
import { useMediaQuery } from '$hooks/useMediaQuery';
import { mainStore } from '$stores/MainStore';
import { IS_ELECTRON } from '$utils/config';
import styles from './Main.module.scss';
import { Status } from './Status';
import { TabBar } from './TabBar';
import { TitleBar } from './TitleBar';

export const Main: React.FC<React.PropsWithChildren> = observer(
  ({ children }) => {
    const isReady = mainStore.isConfigured;
    const isDesktop = useMediaQuery('screen and (min-width: 960px)');

    if (!IS_ELECTRON && !mainStore.ready) {
      return <LoadingOverlay hideBackground />;
    }

    return (
      <div className={styles.main}>
        {isReady ? <TabBar /> : <TitleBar />}
        <div className={styles.wrapper}>{children}</div>
        {isDesktop && isReady && <Status />}
      </div>
    );
  },
);

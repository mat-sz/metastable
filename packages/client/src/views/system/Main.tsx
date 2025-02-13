import { observer } from 'mobx-react-lite';
import React from 'react';

import { LoadingOverlay } from '$components/loadingOverlay';
import { mainStore } from '$stores/MainStore';
import { uiStore } from '$stores/UIStore';
import { IS_ELECTRON } from '$utils/config';
import { LogIn } from './LogIn';
import styles from './Main.module.scss';
import { Status } from './Status';
import { SystemMonitor } from './systemMonitor';
import { TabBar } from './TabBar';
import { TitleBar } from './TitleBar';

export const Main: React.FC<React.PropsWithChildren> = observer(
  ({ children }) => {
    if (mainStore.authorizationRequired) {
      return (
        <div className={styles.main}>
          <TitleBar />
          <div className={styles.wrapper}>
            <LogIn />
          </div>
        </div>
      );
    }

    const isReady = mainStore.isConfigured;

    if (!IS_ELECTRON && !mainStore.ready) {
      return <LoadingOverlay hideBackground />;
    }

    return (
      <div className={styles.main}>
        {isReady ? <TabBar /> : <TitleBar />}
        <div className={styles.wrapper}>{children}</div>
        {uiStore.showSystemMonitor && <SystemMonitor />}
        {isReady && <Status />}
      </div>
    );
  },
);

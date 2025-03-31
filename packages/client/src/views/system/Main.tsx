import { observer } from 'mobx-react-lite';
import React from 'react';

import { LoadingOverlay } from '$components/loadingOverlay';
import { useModalCondition } from '$hooks/useModal';
import { InstanceUpdateAvailable } from '$modals/instance/updateAvailable';
import { ProjectUnsaved } from '$modals/project/unsaved';
import { useIsReady } from '$store/hooks/useIsReady';
import { useInstanceStore } from '$store/instance';
import { useUIStore } from '$store/ui';
import { useUpdateStore } from '$store/update';
import { mainStore } from '$stores/MainStore';
import { IS_ELECTRON } from '$utils/config';
import { LogIn } from './LogIn';
import styles from './Main.module.scss';
import { Status } from './Status';
import { SystemMonitor } from './systemMonitor';
import { TabBar } from './TabBar';
import { TitleBar } from './TitleBar';

export const Main: React.FC<React.PropsWithChildren> = observer(
  ({ children }) => {
    const isReady = useIsReady();

    const showSystemMonitor = useUIStore(state => state.showSystemMonitor);
    const version = useUpdateStore(state => state.availableVersion);
    const authorizationRequired = useInstanceStore(
      state => state.authorizationRequired,
    );
    useModalCondition(
      <InstanceUpdateAvailable version={version!} />,
      () => !!version,
      [version],
    );

    const unsaved = mainStore.projects.unsavedProjectsModalData;
    useModalCondition(<ProjectUnsaved />, () => !!unsaved, [unsaved]);

    if (authorizationRequired) {
      return (
        <div className={styles.main}>
          <TitleBar />
          <div className={styles.wrapper}>
            <LogIn />
          </div>
        </div>
      );
    }

    const isConfigured = isReady && mainStore.isConfigured;

    if (!IS_ELECTRON && (!mainStore.ready || !isReady)) {
      return <LoadingOverlay hideBackground />;
    }

    return (
      <div className={styles.main}>
        {isConfigured ? <TabBar /> : <TitleBar />}
        <div className={styles.wrapper}>{children}</div>
        {showSystemMonitor && <SystemMonitor />}
        {isConfigured && <Status />}
      </div>
    );
  },
);

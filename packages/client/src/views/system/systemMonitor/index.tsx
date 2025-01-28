import React from 'react';
import { BsXLg } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { Log } from '$components/log';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { mainStore } from '$stores/MainStore';
import { uiStore } from '$stores/UIStore';
import styles from './index.module.scss';
import { Utilization } from './Utilization';
import { LoadedModelsList } from '../../common/backend/LoadedModelsList';

export const SystemMonitor: React.FC = () => {
  return (
    <div className={styles.systemMonitor}>
      <TabView defaultTab="loadedModels" className={styles.tabs}>
        <Tabs>
          <Tab id="loadedModels" title="Loaded models" />
          <Tab id="logs" title="Logs" />
        </Tabs>
        <TabContent className={styles.content}>
          <TabPanel id="loadedModels">
            <LoadedModelsList />
          </TabPanel>
          <TabPanel id="logs">
            <Log className={styles.log} items={mainStore.backendLog} />
          </TabPanel>
        </TabContent>
      </TabView>
      <div className={styles.right}>
        <div className={styles.rightHeader}>
          <IconButton onClick={() => uiStore.toggleSystemMonitor()}>
            <BsXLg />
          </IconButton>
        </div>
        <Utilization />
      </div>
    </div>
  );
};

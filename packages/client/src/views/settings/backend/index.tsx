import React from 'react';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import styles from './index.module.scss';
import { LoadedModelsTab } from './loadedModels';
import { LogsTab } from './logs';
import { SettingsTab } from './settings';
import { StatusTab } from './status';

export const SettingsBackend: React.FC = () => {
  return (
    <TabPanel id="backend">
      <h2>Backend</h2>
      <TabView defaultTab="settings">
        <Tabs>
          <Tab id="settings" title="Settings" />
          <Tab id="status" title="Status" />
          <Tab id="logs" title="Logs" />
          <Tab id="loadedModels" title="Loaded models" />
        </Tabs>
        <TabContent className={styles.content}>
          <SettingsTab />
          <StatusTab />
          <LogsTab />
          <LoadedModelsTab />
        </TabContent>
      </TabView>
    </TabPanel>
  );
};

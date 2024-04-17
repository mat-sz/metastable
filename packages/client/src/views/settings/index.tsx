import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsGearFill } from 'react-icons/bs';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarString, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

export const Settings: React.FC = observer(() => {
  const config = mainStore.config;

  if (!config.data) {
    return <div>Loading...</div>;
  }

  return (
    <VarUI
      values={toJS(config.data!)}
      onChange={value => config.set(value)}
      className={styles.settings}
    >
      <TabView defaultTab="general" variant="large" direction="vertical">
        <Tabs>
          <Tab id="general" title="General" icon={<BsGearFill />} />
          <Tab id="downloads" title="Downloads" icon={<BsDownload />} />
        </Tabs>
        <TabContent>
          <TabPanel id="general">Empty.</TabPanel>
          <TabPanel id="downloads">
            <VarString path="civitai.apiKey" label="CivitAI API key" />
          </TabPanel>
        </TabContent>
      </TabView>
    </VarUI>
  );
});

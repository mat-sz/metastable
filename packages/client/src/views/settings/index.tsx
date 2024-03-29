import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { VarString, VarUI } from 'react-var-ui';

import { Tab, TabContent, TabPanel, TabView, Tabs } from '$components/tabs';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { BsDownload, BsGearFill } from 'react-icons/bs';

export const Settings: React.FC = observer(() => {
  const config = mainStore.config;
  const [temp, setTemp] = useState(config.data!);
  useEffect(() => {
    setTemp(config.data!);
  }, [config.data]);

  return (
    <VarUI values={temp} onChange={setTemp} className={styles.settings}>
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
      <button onClick={() => config.store(temp)}>Save</button>
    </VarUI>
  );
});

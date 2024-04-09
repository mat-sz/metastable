import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { BsDownload, BsGearFill } from 'react-icons/bs';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarString, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

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

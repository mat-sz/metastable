import React, { useEffect, useState } from 'react';

import {
  Modal,
  Tab,
  TabContent,
  TabPanel,
  TabView,
  Tabs,
} from '../../components';
import { observer } from 'mobx-react-lite';
import { mainStore } from '../../stores/MainStore';
import { VarString, VarUI } from 'react-var-ui';

export const Config: React.FC = observer(() => {
  const config = mainStore.config;
  const [temp, setTemp] = useState(config.data!);
  useEffect(() => {
    setTemp(config.data!);
  }, [config.data]);

  return (
    <Modal title="Settings">
      <VarUI values={temp} onChange={setTemp}>
        <TabView defaultTab="general">
          <Tabs>
            <Tab id="general" title="General" />
            <Tab id="downloads" title="Downloads" />
          </Tabs>
          <TabContent>
            <TabPanel id="general"></TabPanel>
            <TabPanel id="downloads">
              <VarString path="civitai.apiKey" label="CivitAI API key" />
            </TabPanel>
          </TabContent>
        </TabView>
        <button onClick={() => config.store(temp)}>Save</button>
      </VarUI>
    </Modal>
  );
});

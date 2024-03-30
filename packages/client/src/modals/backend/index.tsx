import React from 'react';

import { Modal } from '$components/modal';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { Compatibility } from './compatibility';
import { General } from './general';

export const Backend: React.FC = () => {
  return (
    <Modal title="Backend status">
      <TabView defaultTab="general">
        <Tabs>
          <Tab id="general" title="General" />
          <Tab id="compatibility" title="Compatibility" />
        </Tabs>
        <TabContent>
          <TabPanel id="general">
            <General />
          </TabPanel>
          <TabPanel id="compatibility">
            <Compatibility />
          </TabPanel>
        </TabContent>
      </TabView>
    </Modal>
  );
};

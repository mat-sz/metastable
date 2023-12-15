import React from 'react';

import { Modal } from '../../components/Modal';
import { Tab, TabPanel, TabView, Tabs } from '../../components/Tabs';
import { General } from './general';
import { Compatibility } from './compatibility';

export const Backend: React.FC = () => {
  return (
    <Modal title="Backend status">
      <TabView defaultTab="general">
        <Tabs>
          <Tab id="general" title="General" />
          <Tab id="compatibility" title="Compatibility" />
        </Tabs>
        <TabPanel id="general">
          <General />
        </TabPanel>
        <TabPanel id="compatibility">
          <Compatibility />
        </TabPanel>
      </TabView>
    </Modal>
  );
};

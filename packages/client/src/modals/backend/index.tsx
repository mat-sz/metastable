import React from 'react';

import {
  Modal,
  Tab,
  TabContent,
  TabPanel,
  TabView,
  Tabs,
} from '../../components';
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

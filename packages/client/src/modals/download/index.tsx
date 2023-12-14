import React from 'react';

import { Modal } from '../../components/Modal';
import { Tab, TabPanel, TabView, Tabs } from '../../components/Tabs';
import { Queue } from './Queue';
import { Recommended } from './Recommended';
import { CivitAI } from './civitai';

export const DownloadManager: React.FC = () => {
  return (
    <Modal title="Download manager">
      <TabView defaultTab="queue">
        <Tabs>
          <Tab id="queue" title="Queue" />
          <Tab id="recommended" title="Recommended" />
          <Tab id="civitai" title="CivitAI" />
        </Tabs>
        <TabPanel id="queue">
          <Queue />
        </TabPanel>
        <TabPanel id="recommended">
          <Recommended />
        </TabPanel>
        <TabPanel id="civitai">
          <CivitAI />
        </TabPanel>
      </TabView>
    </Modal>
  );
};

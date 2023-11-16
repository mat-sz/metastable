import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';
import { Tab, TabPanel, TabView, Tabs } from '../../components/Tabs';
import { Queue } from './Queue';
import { Recommended } from './Recommended';
import { CivitAI } from './civitai';

export const DownloadManager: React.FC = observer(() => {
  const downloads = mainStore.downloads;

  return (
    <Modal
      title="Download manager"
      isOpen={downloads.isOpen}
      onClose={() => downloads.close()}
    >
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
});

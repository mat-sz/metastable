import React from 'react';

import { Modal } from '$components/modal';
import { Tab, TabContent, TabPanel, TabView, Tabs } from '$components/tabs';
import { Queue } from './queue';
import { Recommended } from './recommended';
import { CivitAI } from './civitai';
import { InstalledModels } from './installed';

interface Props {
  defaultTab?: 'installed' | 'queue' | 'recommended' | 'civitai';
}

export const ModelManager: React.FC<Props> = ({ defaultTab = 'installed' }) => {
  return (
    <Modal title="Model manager">
      <TabView defaultTab={defaultTab}>
        <Tabs>
          <Tab id="installed" title="Installed models" />
          <Tab id="queue" title="Download queue" />
          <Tab id="recommended" title="Recommended" />
          <Tab id="civitai" title="CivitAI" />
        </Tabs>
        <TabContent>
          <TabPanel id="installed">
            <InstalledModels />
          </TabPanel>
          <TabPanel id="queue">
            <Queue />
          </TabPanel>
          <TabPanel id="recommended">
            <Recommended />
          </TabPanel>
          <TabPanel id="civitai">
            <CivitAI />
          </TabPanel>
        </TabContent>
      </TabView>
    </Modal>
  );
};

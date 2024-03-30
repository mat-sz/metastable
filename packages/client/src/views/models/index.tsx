import React from 'react';
import { BsDownload, BsGlobe, BsHddFill, BsStarFill } from 'react-icons/bs';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { CivitAI } from './civitai';
import { InstalledModels } from './installed';
import { Queue } from './queue';
import { Recommended } from './recommended';

interface Props {
  defaultTab?: 'installed' | 'queue' | 'recommended' | 'civitai';
}

export const ModelManager: React.FC<Props> = ({ defaultTab = 'installed' }) => {
  return (
    <TabView defaultTab={defaultTab} variant="large" direction="vertical">
      <Tabs>
        <Tab id="installed" title="Installed models" icon={<BsHddFill />} />
        <Tab id="queue" title="Download queue" icon={<BsDownload />} />
        <Tab id="recommended" title="Recommended" icon={<BsStarFill />} />
        <Tab id="civitai" title="CivitAI" icon={<BsGlobe />} />
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
  );
};

import { ProjectFileType } from '@metastable/types';
import React from 'react';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { TYPE_MAP } from '$utils/image';
import { Files } from './Files';
import styles from './index.module.scss';

export const Grid: React.FC = () => {
  return (
    <TabView
      defaultTab={ProjectFileType.OUTPUT}
      direction="vertical"
      className={styles.wrapper}
    >
      <Tabs>
        {Object.values(ProjectFileType).map(type => (
          <Tab id={type} title={TYPE_MAP[type]} key={type} />
        ))}
      </Tabs>
      <TabContent>
        {Object.values(ProjectFileType).map(type => (
          <TabPanel key={type} id={type}>
            <Files type={type} allowUpload={type !== ProjectFileType.OUTPUT} />
          </TabPanel>
        ))}
      </TabContent>
    </TabView>
  );
};

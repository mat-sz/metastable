import React from 'react';
import { observer } from 'mobx-react-lite';
import { ModelType } from '@metastable/types';

import { Tab, TabContent, TabPanel, TabView, Tabs } from '$components/tabs';
import { ModelBrowser } from '$components/modelBrowser';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

export const InstalledModels: React.FC = observer(() => {
  const types = Object.entries(mainStore.info.models)
    .filter(entry => entry[1].length > 0)
    .map(entry => entry[0]);

  const firstKey = types[0] || ModelType.CHECKPOINT;

  return (
    <TabView defaultTab={firstKey} direction="vertical" className={styles.view}>
      <Tabs>
        {types.map(key => (
          <Tab id={key} key={key} title={key} />
        ))}
      </Tabs>
      <TabContent>
        {types.map(key => (
          <TabPanel id={key} key={key}>
            <ModelBrowser type={key} onSelect={() => {}} />
          </TabPanel>
        ))}
      </TabContent>
    </TabView>
  );
});

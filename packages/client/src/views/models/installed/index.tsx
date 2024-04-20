import { observer } from 'mobx-react-lite';
import React from 'react';

import { ModelBrowser } from '$components/modelBrowser';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { modelStore } from '$stores/ModelStore';
import styles from './index.module.scss';

export const InstalledModels: React.FC = observer(() => {
  const types = modelStore.types;
  const firstKey = types[0];

  if (!firstKey) {
    return <div>No installed models found.</div>;
  }

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

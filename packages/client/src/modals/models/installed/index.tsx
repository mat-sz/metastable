import React from 'react';
import { observer } from 'mobx-react-lite';
import { ModelType } from '@metastable/types';

import { Tab, TabContent, TabPanel, TabView, Tabs } from '$components/tabs';
import { ModelBrowser } from '$components/modelBrowser';
import { useUI } from '$components/ui';
import { modelStore } from '$stores/ModelStore';
import styles from './index.module.scss';
import { ModelEdit } from '$modals/modelEdit';

export const InstalledModels: React.FC = observer(() => {
  const types = modelStore.types;
  const firstKey = types[0] || ModelType.CHECKPOINT;
  const { showModal } = useUI();

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
            <ModelBrowser
              type={key}
              onSelect={model => {
                showModal(
                  <ModelEdit name={model.file.name} type={model.type} />,
                );
              }}
            />
          </TabPanel>
        ))}
      </TabContent>
    </TabView>
  );
});

import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';
import { Tab, TabPanel, TabView, Tabs } from '../../components/Tabs';
import { filesize } from '../../helpers';

export const ModelManager: React.FC = observer(() => {
  const available = Object.entries(mainStore.info.models).filter(
    entry => entry[1].length > 0,
  );

  return (
    <Modal
      title="Model manager"
      isOpen={mainStore.modal === 'models'}
      onClose={() => (mainStore.modal = undefined)}
    >
      <TabView defaultTab="queue">
        <Tabs>
          {available.map(([key]) => (
            <Tab id={key} key={key} title={key} />
          ))}
        </Tabs>
        {available.map(([key, models]) => (
          <TabPanel id={key} key={key}>
            {models.map(model => (
              <li key={model.name}>
                {model.name} - {filesize(model.size)}
              </li>
            ))}
          </TabPanel>
        ))}
      </TabView>
    </Modal>
  );
});

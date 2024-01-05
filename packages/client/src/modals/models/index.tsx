import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import {
  Modal,
  Tab,
  TabContent,
  TabPanel,
  TabView,
  Tabs,
} from '../../components';
import { filesize } from '../../helpers';

export const ModelManager: React.FC = observer(() => {
  const available = Object.entries(mainStore.info.models).filter(
    entry => entry[1].length > 0,
  );

  return (
    <Modal title="Model manager">
      <TabView defaultTab="queue">
        <Tabs>
          {available.map(([key]) => (
            <Tab id={key} key={key} title={key} />
          ))}
        </Tabs>
        <TabContent>
          {available.map(([key, models]) => (
            <TabPanel id={key} key={key}>
              {models.map(({ file }) => (
                <li key={file.name}>
                  {file.name} - {filesize(file.size)}
                </li>
              ))}
            </TabPanel>
          ))}
        </TabContent>
      </TabView>
    </Modal>
  );
});

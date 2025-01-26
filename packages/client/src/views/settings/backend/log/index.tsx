import { observer } from 'mobx-react-lite';
import React from 'react';

import { Log } from '$components/log';
import { TabPanel } from '$components/tabs';
import { mainStore } from '$stores/MainStore';

export const LogTab: React.FC = observer(() => {
  return (
    <TabPanel id="log">
      <Log items={mainStore.backendLog} />
    </TabPanel>
  );
});

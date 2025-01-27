import { observer } from 'mobx-react-lite';
import React from 'react';

import { Log } from '$components/log';
import { TabPanel } from '$components/tabs';
import { mainStore } from '$stores/MainStore';

export const LogsTab: React.FC = observer(() => {
  return (
    <TabPanel id="logs">
      <Log items={mainStore.backendLog} />
    </TabPanel>
  );
});

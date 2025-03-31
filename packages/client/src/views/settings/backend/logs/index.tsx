import React from 'react';

import { Log } from '$components/log';
import { TabPanel } from '$components/tabs';
import { useBackendStore } from '$store/backend';

export const LogsTab: React.FC = () => {
  const log = useBackendStore(state => state.log);
  return (
    <TabPanel id="logs">
      <Log items={log} />
    </TabPanel>
  );
};

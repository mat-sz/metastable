import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategory, VarString } from '$components/var';

export const SettingsDownloads: React.FC = observer(() => {
  return (
    <TabPanel id="downloads">
      <h2>Downloads</h2>
      <VarCategory label="CivitAI">
        <VarString path="civitai.apiKey" label="CivitAI API key" />
      </VarCategory>
    </TabPanel>
  );
});

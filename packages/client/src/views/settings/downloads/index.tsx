import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategoryScope, VarString } from '$components/var';

export const SettingsDownloads: React.FC = observer(() => {
  return (
    <TabPanel id="downloads">
      <h2>Downloads</h2>
      <VarCategoryScope label="Authentication" path="downloader.apiKeys">
        <VarString path="civitai" label="CivitAI API key" />
        <VarString path="huggingface" label="HuggingFace API key" />
      </VarCategoryScope>
    </TabPanel>
  );
});

import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { mainStore } from '$stores/MainStore';

export const LoadedModelsTab: React.FC = observer(() => {
  return (
    <TabPanel id="loadedModels">
      {mainStore.modelCache.length === 0 && (
        <div>No models are currently loaded.</div>
      )}
      <ul>
        {mainStore.modelCache.map(str => (
          <li key={str}>{str}</li>
        ))}
      </ul>
    </TabPanel>
  );
});

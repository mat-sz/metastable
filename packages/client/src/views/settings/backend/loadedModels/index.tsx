import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { LoadedModelsList } from '../../../common/backend/LoadedModelsList';

export const LoadedModelsTab: React.FC = observer(() => {
  return (
    <TabPanel id="loadedModels">
      <LoadedModelsList />
    </TabPanel>
  );
});

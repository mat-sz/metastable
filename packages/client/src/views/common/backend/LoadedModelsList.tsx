import { observer } from 'mobx-react-lite';
import React from 'react';

import { mainStore } from '$stores/MainStore';

export const LoadedModelsList: React.FC = observer(() => {
  return (
    <div>
      {mainStore.modelCache.length === 0 && (
        <div>No models are currently loaded.</div>
      )}
      <ul>
        {mainStore.modelCache.map(str => (
          <li key={str}>{str}</li>
        ))}
      </ul>
    </div>
  );
});

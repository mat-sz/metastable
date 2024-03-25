import React from 'react';

import { ModelList } from '$components/modelList';
import { DownloadButton } from '../DownloadButton';

export const Recommended: React.FC = () => {
  return (
    <ModelList
      afterModel={model => (
        <DownloadButton
          files={model.downloads.map(download => ({
            ...download,
            info: {
              ...model,
              downloads: undefined,
              recommended: undefined,
              type: undefined,
            },
          }))}
        />
      )}
    />
  );
};

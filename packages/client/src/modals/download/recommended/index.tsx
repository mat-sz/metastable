import React from 'react';

import { DownloadButton } from '../DownloadButton';
import { ModelList } from '../../../components/modelList';

export const Recommended: React.FC = () => {
  return (
    <ModelList
      afterModel={model => <DownloadButton files={model.downloads} />}
    />
  );
};

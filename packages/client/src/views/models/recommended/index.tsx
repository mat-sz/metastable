import React from 'react';

import { API } from '$api';
import { ModelList } from '$components/modelList';
import { DownloadButton } from '../DownloadButton';

export const Recommended: React.FC = () => {
  return (
    <ModelList
      afterModel={model => {
        const baseMetadata = {
          name: model.name,
          description: model.description,
          homepage: model.homepage,
          source: model.source,
        };
        return (
          <DownloadButton
            files={model.downloads.map(download => ({
              ...download,
              info: download.ignoreParentMetadata
                ? download.metadata
                : {
                    ...baseMetadata,
                    ...download.metadata,
                  },
            }))}
            onDownload={() => {
              if (model.createMetamodel) {
                API.model.createMetamodel.mutate({
                  ...model.createMetamodel,
                  metadata: {
                    ...baseMetadata,
                    ...model.createMetamodel.metadata,
                  },
                });
              }
            }}
          />
        );
      }}
    />
  );
};

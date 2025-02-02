import { ImageFile } from '@metastable/types';
import React from 'react';
import { BsFolderFill } from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { TreeBrowser } from '$components/treeBrowser';
import { getItemsFactory } from '$components/treeBrowser/helpers';
import { IS_ELECTRON } from '$utils/config';
import { resolveImage } from '$utils/url';

export interface ImageBrowserProps {
  files?: ImageFile[];
  defaultParts?: string[];
  showBreadcrumbs?: boolean;
  onSelect: (mrn: string) => void;
}

export const ImageBrowser: React.FC<ImageBrowserProps> = ({
  onSelect,
  defaultParts = [],
  files = [],
  showBreadcrumbs,
}) => {
  return (
    <TreeBrowser
      small
      view="grid"
      defaultParts={defaultParts}
      showBreadcrumbs={showBreadcrumbs}
      actions={items => {
        const first = items.find(item => item.type === 'item');

        return (
          <>
            {IS_ELECTRON && first && (
              <IconButton
                title="Reveal in explorer"
                onClick={() => {
                  API.electron.shell.showItemInFolder.mutate(first.data.mrn);
                }}
              >
                <BsFolderFill />
              </IconButton>
            )}
          </>
        );
      }}
      onSelect={item => onSelect(item?.data.mrn)}
      getItems={getItemsFactory(
        files,
        file => file.mrn,
        file => file.parts,
      )}
      getCardProps={item => {
        const file = item.data;

        return {
          name: file.name,
          imageUrl: resolveImage(file.mrn, 'thumbnail'),
        };
      }}
    />
  );
};

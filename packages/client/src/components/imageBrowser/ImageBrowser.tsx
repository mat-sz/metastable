import React from 'react';
import { BsFolderFill } from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { TreeBrowser } from '$components/treeBrowser';
import { ImageFileTreeNode } from '$types/project';
import { IS_ELECTRON } from '$utils/config';
import { resolveImage } from '$utils/url';

export interface ImageBrowserProps {
  files?: ImageFileTreeNode[];
  defaultParentId?: string;
  showBreadcrumbs?: boolean;
  onSelect: (mrn: string | undefined) => void;
}

export const ImageBrowser: React.FC<ImageBrowserProps> = ({
  onSelect,
  defaultParentId,
  files = [],
  showBreadcrumbs,
}) => {
  return (
    <TreeBrowser
      small
      view="grid"
      defaultParentId={defaultParentId}
      showBreadcrumbs={showBreadcrumbs}
      actions={items => {
        const first = items.find(item => item.nodeType === 'item');

        return (
          <>
            {IS_ELECTRON && first && (
              <IconButton
                title="Reveal in explorer"
                onClick={() => {
                  API.electron.shell.showItemInFolder.mutate(first.mrn);
                }}
              >
                <BsFolderFill />
              </IconButton>
            )}
          </>
        );
      }}
      onSelect={item => onSelect(item?.mrn)}
      nodes={files}
      getCardProps={file => {
        return {
          name: file.name,
          imageUrl: resolveImage(file.mrn, 'thumbnail'),
        };
      }}
    />
  );
};

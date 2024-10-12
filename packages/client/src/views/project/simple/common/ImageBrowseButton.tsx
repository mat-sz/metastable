import { ProjectFileType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsFolderFill } from 'react-icons/bs';
import { Popover } from 'react-tiny-popover';

import { ImageBrowser } from './ImageBrowser';

interface Props {
  onSelect: (internalUrl: string) => void;
  defaultType?: ProjectFileType;
  forceType?: ProjectFileType;
}

export const ImageBrowseButton = observer(
  ({ onSelect, defaultType, forceType }: Props): JSX.Element => {
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);

    return (
      <Popover
        isOpen={isBrowserOpen}
        positions={['bottom', 'left', 'right', 'top']}
        containerStyle={{ zIndex: '10' }}
        onClickOutside={() => setIsBrowserOpen(false)}
        content={
          <ImageBrowser
            defaultType={defaultType}
            forceType={forceType}
            onSelect={url => {
              setIsBrowserOpen(false);
              onSelect(url);
            }}
          />
        }
      >
        <button
          onClick={e => {
            e.stopPropagation();
            setIsBrowserOpen(current => !current);
          }}
        >
          <BsFolderFill />
          <span>Browse...</span>
        </button>
      </Popover>
    );
  },
);

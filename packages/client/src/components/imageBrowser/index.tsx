import { useState } from 'react';
import { BsFolderFill } from 'react-icons/bs';

import { Button } from '$components/button';
import { Popover } from '$components/popover';
import { ImageBrowser, ImageBrowserProps } from './ImageBrowser';

export const ImageBrowseButton = ({
  onSelect,
  ...props
}: ImageBrowserProps): JSX.Element => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  return (
    <Popover
      isOpen={isBrowserOpen}
      positions={['bottom', 'left', 'right', 'top']}
      containerStyle={{ zIndex: '10' }}
      onClickOutside={() => setIsBrowserOpen(false)}
      content={
        <ImageBrowser
          {...props}
          onSelect={url => {
            setIsBrowserOpen(false);
            onSelect(url);
          }}
        />
      }
    >
      <Button
        onClick={e => {
          e.stopPropagation();
          setIsBrowserOpen(current => !current);
        }}
        icon={<BsFolderFill />}
      >
        Browse...
      </Button>
    </Popover>
  );
};

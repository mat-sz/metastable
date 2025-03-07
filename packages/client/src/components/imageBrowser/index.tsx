import { BsFolderFill } from 'react-icons/bs';

import { Button } from '$components/button';
import { usePopover } from '$hooks/usePopover';
import { ImageBrowser, ImageBrowserProps } from './ImageBrowser';

export const ImageBrowseButton = ({
  onSelect,
  ...props
}: ImageBrowserProps): JSX.Element => {
  const { popover, onClick, hide } = usePopover(
    <ImageBrowser
      {...props}
      onSelect={mrn => {
        hide();
        onSelect(mrn);
      }}
    />,
  );

  return (
    <>
      <Button onClick={onClick} icon={<BsFolderFill />}>
        Browse...
      </Button>
      {popover}
    </>
  );
};

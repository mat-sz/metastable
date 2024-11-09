import {
  Popover as OriginalPopover,
  PopoverProps as OriginalPopoverProps,
} from 'react-tiny-popover';

import { usePopoverContext } from './context';

export const Popover = (props: OriginalPopoverProps): JSX.Element => {
  const { parentElementRef } = usePopoverContext();
  return (
    <OriginalPopover
      {...props}
      parentElement={parentElementRef?.current ?? undefined}
    />
  );
};

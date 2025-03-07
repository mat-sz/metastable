import { ReactNode, useContext } from 'react';

import { ContextMenuContext } from '../ContextMenuContext';
import { ContextMenuItem, ContextMenuItemProps } from './ContextMenuItem';
import { useContextMenu } from '../hooks/useContextMenu';

interface Props extends ContextMenuItemProps {
  items?: ReactNode;
}

export const ContextMenuSubmenu: React.FC<Props> = ({ items, ...props }) => {
  const { contextMenu, show, hide } = useContextMenu(items, {
    alignTo: 'right',
    noBackdrop: true,
  });

  const { menuRef } = useContext(ContextMenuContext);

  const onSelect = (event: React.UIEvent) => {
    event.stopPropagation();
    show({ positioningTarget: event, focusTarget: menuRef?.current });
  };

  const onPointerOver = (event: React.SyntheticEvent) => {
    show({ positioningTarget: event, focusTarget: menuRef?.current });
  };

  return (
    <>
      <ContextMenuItem
        onSelect={onSelect}
        onPointerOver={onPointerOver}
        {...props}
        onBlur={hide}
        isSubmenu
      />
      {contextMenu}
    </>
  );
};

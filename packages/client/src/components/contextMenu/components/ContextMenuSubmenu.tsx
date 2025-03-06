import { ReactNode, useContext } from 'react';

import { ContextMenuContext } from '../ContextMenuContext';
import { ContextMenuItem, ContextMenuItemProps } from './ContextMenuItem';
import { useContextMenu } from '../hooks/useContextMenu';

interface Props extends ContextMenuItemProps {
  items?: ReactNode;
}

export const ContextMenuSubmenu: React.FC<Props> = ({ items, ...props }) => {
  const { contextMenu, onContextMenu, hideMenu } = useContextMenu(items, {
    alignTo: 'right',
    isSubmenu: true,
  });

  const { menuRef } = useContext(ContextMenuContext);

  const onSelect = (event: React.UIEvent) => {
    event.stopPropagation();
    onContextMenu(event, {
      focusTarget: menuRef?.current,
    });
  };

  const onPointerOver = (event: React.SyntheticEvent) => {
    onContextMenu(event, {
      focusTarget: menuRef?.current,
    });
  };

  return (
    <>
      <ContextMenuItem
        onSelect={onSelect}
        onPointerOver={onPointerOver}
        {...props}
        onBlur={hideMenu}
        isSubmenu
      />
      {contextMenu}
    </>
  );
};

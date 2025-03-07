import clsx from 'clsx';
import {
  CSSProperties,
  ReactNode,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { PopoverShowOptions, usePopover } from '$hooks/usePopover';
import { wrapAround } from '$utils/math';
import {
  ContextMenuContext,
  ContextMenuContextType,
} from '../ContextMenuContext';
import { AlignTo } from '../types';
import styles from './useContextMenu.module.scss';

const ATTR_MENU_ITEM = 'data-context-menu-item';
const ATTR_SELECTED = 'aria-selected';
const ATTR_DISABLED = 'data-disabled';
const SELECTOR_ITEM = `div[${ATTR_MENU_ITEM}]`;
const SELECTOR_ITEM_SELECTED = `${SELECTOR_ITEM}[${ATTR_SELECTED}="true"]`;

interface MenuItemsState {
  menuItems: HTMLDivElement[];
  enabledMenuItems: number[];
}

const getMenuItems = (menu: HTMLDivElement) => {
  const menuItems = [
    ...menu.querySelectorAll(SELECTOR_ITEM),
  ] as HTMLDivElement[];

  const enabledMenuItems = menuItems.reduce(
    (reduced: number[], menuItem, index) => {
      if (menuItem.getAttribute(ATTR_DISABLED) !== 'true') {
        reduced.push(index);
      }
      return reduced;
    },
    [],
  );

  return {
    menuItems,
    enabledMenuItems,
  } as MenuItemsState;
};

const clearSelectedItem = (menu: HTMLDivElement) => {
  const items = menu.querySelectorAll(SELECTOR_ITEM_SELECTED);
  for (const item of items) {
    item.removeAttribute(ATTR_SELECTED);
  }
};

const getSelectedItem = (menu: HTMLDivElement) => {
  const item = menu.querySelector(SELECTOR_ITEM_SELECTED);
  return item as HTMLDivElement | undefined;
};

export function useContextMenu(
  contextMenuItems: ReactNode,
  options: {
    alignTo?: AlignTo;
    className?: string;
    dataTestId?: string;
    dataTestName?: string;
    onHide?: () => void | Promise<void>;
    onShow?: (event?: React.SyntheticEvent) => void | Promise<void>;
    style?: CSSProperties;
    noBackdrop?: boolean;
  } = {},
): {
  contextMenu?: ReactNode;
  show: (options: PopoverShowOptions) => void;
  hide: () => void;
  onContextMenu: (event: React.SyntheticEvent) => void;
} {
  const { onHide, onShow } = options;

  const [currentFocusId, setCurrentFocusId] = useState<string>();
  const menuItemsStateRef = useRef<MenuItemsState>();

  const focusItem = useCallback(
    (element?: HTMLDivElement) => {
      const menu = popoverRef.current as HTMLDivElement;
      clearSelectedItem(menu);
      element?.setAttribute('aria-selected', 'true');
      setCurrentFocusId(element?.id);
    },
    [setCurrentFocusId],
  );

  const focus = (focusIndex: number) => {
    if (!menuItemsStateRef.current) {
      return;
    }

    const { menuItems, enabledMenuItems } = menuItemsStateRef.current;
    const index = enabledMenuItems[focusIndex];
    const menuItem = menuItems[index];
    focusItem(menuItem);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const menu = popoverRef.current;
    if (!menu || !menuItemsStateRef.current) {
      return;
    }

    const { menuItems, enabledMenuItems } = menuItemsStateRef.current;
    const selectedItem = getSelectedItem(menu);
    let focusIndex = menuItems.indexOf(selectedItem!);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const delta = event.key === 'ArrowUp' ? -1 : 1;
        focusIndex = wrapAround(
          focusIndex + delta,
          0,
          enabledMenuItems.length - 1,
        );
        focus(focusIndex);
        event.preventDefault();
        event.stopPropagation();
        break;
      }
      case 'ArrowLeft':
        hide();
        break;
      case 'ArrowRight':
      case 'Enter':
        selectedItem?.click();
        break;
      case 'Tab': {
        if (event.shiftKey) {
          focusIndex =
            focusIndex - 1 >= 0 ? focusIndex - 1 : enabledMenuItems.length - 1;
        } else {
          focusIndex =
            focusIndex + 1 < enabledMenuItems.length ? focusIndex + 1 : 0;
        }
        focus(focusIndex);
        event.preventDefault();
        event.stopPropagation();
        break;
      }
    }
  };

  const wrappedOnShow = (event?: React.SyntheticEvent) => {
    const menu = popoverRef.current;
    if (!menu) {
      return;
    }

    menuItemsStateRef.current = getMenuItems(menu);
    if (!event?.isTrusted) {
      focus(0);
    }

    menu.addEventListener('keydown', onKeyDown);
    onShow?.(event);
  };

  const wrappedOnHide = () => {
    const menu = popoverRef.current;
    menu?.removeEventListener('keydown', onKeyDown);
    onHide?.();
  };

  const { show, hide, onClick, popover, popoverRef } = usePopover(
    contextMenuItems,
    {
      ...options,
      className: clsx(styles.contextMenu, options.className),
      alignTo: options.alignTo ?? 'auto-cursor',
      onShow: wrappedOnShow,
      onHide: wrappedOnHide,
    },
  );

  const committedValuesRef = useRef<{
    onHide?: () => void | Promise<void>;
    onShow?: (event: UIEvent) => void | Promise<void>;
  }>({ onHide, onShow });

  useEffect(() => {
    committedValuesRef.current.onHide = onHide;
    committedValuesRef.current.onShow = onShow;
  });

  const context = useMemo<ContextMenuContextType>(
    () => ({
      focusItem,
      currentFocusId,
      menuRef: popoverRef,
    }),
    [focusItem, currentFocusId],
  );

  let contextMenu;
  if (popover) {
    contextMenu = (
      <ContextMenuContext.Provider value={context}>
        {popover}
      </ContextMenuContext.Provider>
    );
  }

  return {
    contextMenu,
    show,
    hide,
    onContextMenu: onClick,
  };
}

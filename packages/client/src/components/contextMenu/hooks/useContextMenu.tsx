import {
  CSSProperties,
  ReactNode,
  KeyboardEvent as SyntheticKeyboardEvent,
  MouseEvent as SyntheticMouseEvent,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { wrapAround } from '$utils/math';
import { ContextMenu } from '../components/ContextMenu';
import {
  ContextMenuContext,
  ContextMenuContextType,
} from '../ContextMenuContext';
import { AlignTo } from '../types';

interface State {
  clientX: number;
  clientY: number;
  event?: React.SyntheticEvent;
  target: HTMLElement;
  targetRect: DOMRect;
}

interface ShowMenuOptions {
  positioningTarget?: HTMLElement;
  focusTarget?: HTMLElement;
}

const ATTR_MENU_ITEM = 'data-context-menu-item';
const ATTR_SELECTED = 'aria-selected';
const ATTR_DISABLED = 'data-disabled';
const SELECTOR_ITEM = `div[${ATTR_MENU_ITEM}]`;
const SELECTOR_ITEM_SELECTED = `${SELECTOR_ITEM}[${ATTR_SELECTED}="true"]`;

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
  };
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
    requireClickToShow?: boolean;
    style?: CSSProperties;
    isSubmenu?: boolean;
  } = {},
): {
  contextMenu: ReactNode | null;
  hideMenu: () => void;
  onKeyDown: (event: SyntheticKeyboardEvent) => void;
  onContextMenu: (
    event?: React.SyntheticEvent,
    options?: ShowMenuOptions,
  ) => void;
} {
  const {
    alignTo = 'auto-cursor',
    className,
    dataTestId,
    dataTestName,
    onHide,
    onShow,
    requireClickToShow = false,
    style,
    isSubmenu,
  } = options;

  const [state, setState] = useState<State>();
  const [currentFocusId, setCurrentFocusId] = useState<string>();

  const menuRef = useRef<HTMLDivElement>();

  const registerMenu = useCallback((menu: HTMLDivElement) => {
    menuRef.current = menu;
  }, []);

  const focusItem = useCallback(
    (element?: HTMLDivElement) => {
      const menu = menuRef.current as HTMLDivElement;
      clearSelectedItem(menu);
      element?.setAttribute('aria-selected', 'true');
      setCurrentFocusId(element?.id);
    },
    [setCurrentFocusId],
  );

  const hideMenu = useCallback(() => {
    const { onHide, state } = committedValuesRef.current;

    if (!state) {
      return;
    }

    setState(undefined);

    if (typeof onHide === 'function') {
      onHide();
    }
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }

    const target = state.target;
    const menu = menuRef.current as HTMLDivElement;

    target.blur();
    menu.focus();

    const { menuItems, enabledMenuItems } = getMenuItems(menu);

    const focus = (focusIndex: number) => {
      const index = enabledMenuItems[focusIndex];
      const menuItem = menuItems[index];
      focusItem(menuItem);
    };

    if (!state.event?.isTrusted) {
      focus(0);
    }

    const onKeyDown = (event: KeyboardEvent) => {
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
          hideMenu();
          break;
        case 'ArrowRight':
        case 'Enter':
          selectedItem?.click();
          break;
        case 'Tab': {
          if (event.shiftKey) {
            focusIndex =
              focusIndex - 1 >= 0
                ? focusIndex - 1
                : enabledMenuItems.length - 1;
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

    menu.addEventListener('keydown', onKeyDown);

    return () => {
      menu.removeEventListener('keydown', onKeyDown);

      menuItems.splice(0, menuItems.length);

      // Return focus to the target element that triggered the context menu.
      target.focus();
    };
  }, [requireClickToShow, state, hideMenu]);

  const committedValuesRef = useRef<{
    onHide?: () => void | Promise<void>;
    onShow?: (event: UIEvent) => void | Promise<void>;
    state?: State;
  }>({ onHide, onShow, state });

  useEffect(() => {
    committedValuesRef.current.onHide = onHide;
    committedValuesRef.current.onShow = onShow;
    committedValuesRef.current.state = state;
  });

  const context = useMemo<ContextMenuContextType>(
    () => ({
      contextMenuEvent: state?.event,
      registerMenu,
      focusItem,
      currentFocusId,
      menuRef,
    }),
    [registerMenu, focusItem, currentFocusId, state?.event],
  );

  const showMenu = (
    event?: React.SyntheticEvent,
    options: ShowMenuOptions = {},
  ) => {
    if (!contextMenuItems || event?.defaultPrevented) {
      // Support nested context menus
      return;
    }

    event?.preventDefault();

    if (typeof onShow === 'function') {
      onShow(event);
    }

    const currentTarget = event?.currentTarget as HTMLElement | undefined;
    const {
      positioningTarget = currentTarget,
      focusTarget = positioningTarget ?? currentTarget,
    } = options;

    if (!positioningTarget || !focusTarget) {
      return;
    }

    const targetRect = positioningTarget.getBoundingClientRect();
    const clientX = isMouseEvent(event) ? event.clientX : targetRect.x;
    const clientY = isMouseEvent(event) ? event.clientY : targetRect.y;

    setState({
      clientX,
      clientY,
      event,
      target: focusTarget,
      targetRect,
    });
  };

  const onContextMenu = showMenu;
  const onKeyDown = (event: SyntheticKeyboardEvent) => {
    if (state) {
      return;
    } else if (requireClickToShow) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'ContextMenu':
      case 'Enter':
      case ' ': {
        showMenu(event);
        break;
      }
    }
  };

  let contextMenu = null;
  if (state) {
    contextMenu = (
      <ContextMenuContext.Provider value={context}>
        <ContextMenu
          alignTo={alignTo}
          className={className}
          clientX={state.clientX}
          clientY={state.clientY}
          dataTestId={dataTestId}
          dataTestName={dataTestName}
          hide={hideMenu}
          style={style}
          targetRect={state.targetRect}
          isSubmenu={isSubmenu}
        >
          {contextMenuItems}
        </ContextMenu>
      </ContextMenuContext.Provider>
    );
  }

  return {
    contextMenu,
    hideMenu,
    onContextMenu,
    onKeyDown,
  };
}

function isMouseEvent(event: any): event is SyntheticMouseEvent {
  return event?.pageX != null && event?.pageY != null;
}

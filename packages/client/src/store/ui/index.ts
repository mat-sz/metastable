import { create } from 'zustand';

import { API, linkManager } from '$api';
import { IS_ELECTRON } from '$utils/config';
import { combineUnsubscribables } from '$utils/trpc';
import { CivitAIArgs, Theme } from './types';

interface State {
  isFocused: boolean;
  isMaximized: boolean;
  isFullScreen: boolean;
  notificationPermission: NotificationPermission;
  systemTheme: Theme;
  civitaiArgs: CivitAIArgs;
  showSystemMonitor: boolean;
}

interface Actions {
  toggleSystemMonitor: () => void;
  checkNotificationPermission: () => Promise<void>;
  setCivitaiArgs: (args: Partial<CivitAIArgs>) => void;
}

export const useUIStore = create<State & Actions>(set => ({
  isFocused: false,
  isMaximized: false,
  isFullScreen: false,
  notificationPermission: Notification.permission,
  civitaiArgs: {
    query: '',
    type: 'Checkpoint',
    cursor: undefined,
    nsfw: false,
  },
  systemTheme: 'dark',
  showSystemMonitor: false,
  toggleSystemMonitor: () => {
    set(({ showSystemMonitor }) => ({
      showSystemMonitor: !showSystemMonitor,
    }));
  },
  checkNotificationPermission: async () => {
    try {
      await Notification.requestPermission();
    } catch {
      //
    }

    set({
      notificationPermission: Notification.permission,
    });
  },
  setCivitaiArgs: args => {
    set(state => ({ civitaiArgs: { ...state.civitaiArgs, ...args } }));
  },
}));

const themeMatch = window.matchMedia('(prefers-color-scheme: dark)');
const onChange = () =>
  useUIStore.setState({ systemTheme: themeMatch.matches ? 'dark' : 'light' });

themeMatch.addEventListener('change', onChange);
onChange();

if (IS_ELECTRON) {
  linkManager.subscribe(
    combineUnsubscribables(() => [
      API.electron.window.onResize.subscribe(undefined, {
        onData: ({ isMaximized, isFullScreen }) => {
          useUIStore.setState({ isMaximized, isFullScreen });
        },
      }),
      API.electron.window.onFocusChange.subscribe(undefined, {
        onData: ({ isFocused }) => {
          useUIStore.setState({ isFocused });
        },
      }),
    ]),
  );
} else {
  document.addEventListener('visibilitychange', () => {
    useUIStore.setState({ isFocused: document.visibilityState === 'visible' });
  });
}

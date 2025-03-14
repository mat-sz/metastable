import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { IS_ELECTRON } from '$utils/config';
import { combineUnsubscribables } from '$utils/trpc';

export type ViewName = 'home' | 'models' | 'settings' | 'project';
export interface CivitAIArgs {
  query: string;
  type: string;
  nsfw: boolean;
  sort?: string;
  limit?: number;
  cursor?: string;
  baseModels?: string;
}

class UIStore {
  isFocused = false;
  isMaximized = false;
  isFullScreen = false;

  notificationPermission = Notification.permission;

  civitaiArgs: CivitAIArgs = {
    query: '',
    type: 'Checkpoint',
    cursor: undefined,
    nsfw: false,
  };

  systemTheme: 'dark' | 'light';

  showSystemMonitor = false;

  constructor() {
    makeAutoObservable(this);

    const themeMatch = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemTheme = themeMatch.matches ? 'dark' : 'light';
    themeMatch.addEventListener('change', e => {
      this.systemTheme = e.matches ? 'dark' : 'light';
    });

    if (IS_ELECTRON) {
      linkManager.subscribe(
        combineUnsubscribables(() => [
          API.electron.window.onResize.subscribe(undefined, {
            onData: ({ isMaximized, isFullScreen }) => {
              runInAction(() => {
                this.isMaximized = isMaximized;
                this.isFullScreen = isFullScreen;
              });
            },
          }),
          API.electron.window.onFocusChange.subscribe(undefined, {
            onData: ({ isFocused }) => {
              runInAction(() => {
                this.isFocused = isFocused;
              });
            },
          }),
        ]),
      );
    }
  }

  get focused() {
    if (IS_ELECTRON) {
      return this.isFocused;
    }

    return document.visibilityState === 'visible';
  }

  async checkNotificationPermission() {
    try {
      await Notification.requestPermission();
    } catch {
      //
    }

    runInAction(() => {
      this.notificationPermission = Notification.permission;
    });
  }

  toggleSystemMonitor() {
    this.showSystemMonitor = !this.showSystemMonitor;
  }
}

export const uiStore = new UIStore();

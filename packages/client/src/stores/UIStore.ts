import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';
import { IS_ELECTRON } from '$utils/config';

export type ViewName = 'home' | 'models' | 'settings' | 'project';

class UIStore {
  isFocused = false;
  isMaximized = false;
  isFullScreen = false;

  notificationPermission = Notification.permission;

  view: ViewName = 'home';

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      API.electron.window.onResize.subscribe(undefined, {
        onData: ({ isMaximized, isFullScreen }) => {
          runInAction(() => {
            this.isMaximized = isMaximized;
            this.isFullScreen = isFullScreen;
          });
        },
      });
      API.electron.window.onFocusChange.subscribe(undefined, {
        onData: ({ isFocused }) => {
          runInAction(() => {
            this.isFocused = isFocused;
          });
        },
      });
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

  setView(view: ViewName) {
    this.view = view;
  }
}

export const uiStore = new UIStore();
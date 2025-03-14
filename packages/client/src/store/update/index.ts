import { UpdateInfo } from '@metastable/types';
import { create } from 'zustand';

import { API, linkManager } from '$api';
import { IS_ELECTRON } from '$utils/config';
import { combineUnsubscribables } from '$utils/trpc';

type State = {
  info: UpdateInfo;
  ready: boolean;
  availableVersion?: string;
};

type Actions = {
  refresh: () => Promise<void>;
};

export const useUpdateStore = create<State & Actions>(set => ({
  info: {
    canCheckForUpdate: false,
    isAutoUpdateAvailable: false,
  },
  ready: false,
  availableVersion: undefined,
  refresh: async () => {
    set({ ready: false });
    const info = await API.instance.updateInfo.query();
    set({ info, ready: true });
  },
}));

if (IS_ELECTRON) {
  linkManager.subscribe(
    combineUnsubscribables(() => [
      API.electron.autoUpdater.onUpdateDownloaded.subscribe(undefined, {
        onData: ({ updateDownloaded, version }) => {
          if (updateDownloaded) {
            useUpdateStore.setState({ availableVersion: version });
          }
        },
      }),
    ]),
  );
}

useUpdateStore.getState().refresh();

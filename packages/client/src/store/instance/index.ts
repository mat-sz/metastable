import { InstanceInfo } from '@metastable/types';
import { create } from 'zustand';

import { API, linkManager } from '$api';
import { mainStore } from '$stores/MainStore';
import { combineUnsubscribables } from '$utils/trpc';

type State = {
  authorizationRequired: boolean;
  connected: boolean;
  ready: boolean;
  token: string | undefined;
  info: InstanceInfo | undefined;
};

type Actions = {
  refresh: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
};

export const useInstanceStore = create<State & Actions>((set, get) => ({
  authorizationRequired: false,
  connected: linkManager.isConnected,
  ready: false,
  token: undefined,
  info: undefined,
  setToken: async (token: string) => {
    set({ token, authorizationRequired: false, ready: false });
    linkManager.reconnect();
    await get().refresh();
    mainStore.init();
  },
  refresh: async () => {
    try {
      const info = await API.instance.info.query();
      set({ info, ready: true });
    } catch (e: any) {
      if (typeof e === 'object' && e.data?.code === 'UNAUTHORIZED') {
        set({ authorizationRequired: true });
      }
    }
  },
}));

linkManager.tokenCallback = () => useInstanceStore.getState().token;
linkManager.on('connectionStateChange', connected => {
  useInstanceStore.setState({ connected });
});

linkManager.subscribe(
  combineUnsubscribables(() => [
    API.instance.onInfoUpdate.subscribe(undefined, {
      onData: () => {
        useInstanceStore.getState().refresh();
      },
    }),
  ]),
);

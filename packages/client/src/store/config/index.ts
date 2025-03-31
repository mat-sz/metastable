import { ConfigType } from '@metastable/types';
import { create } from 'zustand';

import { API, linkManager } from '$api';
import { combineUnsubscribables } from '$utils/trpc';

type State = {
  data?: ConfigType;
};

type Actions = {
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  triggerAutosave: () => void;
  update: (data: ConfigType) => void;
};

let autosaveTimeout: any = undefined;
export const useConfigStore = create<State & Actions>((set, get) => ({
  data: undefined,
  refresh: async () => {
    const data = await API.instance.config.get.query();
    set({ data });
  },
  save: async () => {
    const data = await API.instance.config.set.mutate(get().data);
    set({ data });
  },
  triggerAutosave: () => {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => get().save(), 500);
  },
  update: data => {
    set({ data });
    get().triggerAutosave();
  },
}));

linkManager.subscribe(
  combineUnsubscribables(() => [
    API.instance.onInfoUpdate.subscribe(undefined, {
      onData: () => {
        useConfigStore.getState().refresh();
      },
    }),
  ]),
);

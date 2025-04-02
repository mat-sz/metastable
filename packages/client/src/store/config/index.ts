import { ConfigType } from '@metastable/types';
import { create } from 'zustand';

import { API, linkManager } from '$api';
import { set as objectSet } from '$utils/object';
import { combineUnsubscribables } from '$utils/trpc';

type State = {
  data?: ConfigType;
};

type Actions = {
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  triggerAutosave: () => void;
  update: (data: ConfigType) => void;
  set: (path: string, value: any) => void;
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
  set: (path, value) => {
    const data = get().data || {};
    get().update(objectSet(data, path, value) as any);
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

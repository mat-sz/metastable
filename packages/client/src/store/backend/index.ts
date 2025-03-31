import { BackendStatus, LogItem } from '@metastable/types';
import { create } from 'zustand';

import { API, linkManager } from '$api';
import { combineUnsubscribables } from '$utils/trpc';

const MAX_LOG_ITEMS = 100;

type State = {
  log: LogItem[];
  status: BackendStatus;
};

type Actions = {
  appendLog: (items: LogItem[]) => void;
};

export const useBackendStore = create<State & Actions>((set, get) => ({
  log: [],
  status: 'starting',
  appendLog: items => {
    const log = get().log;
    set({ log: [...log, ...items].slice(-1 * MAX_LOG_ITEMS) });
  },
}));

linkManager.subscribe(
  combineUnsubscribables(() => [
    API.instance.onBackendLog.subscribe(undefined, {
      onData: items => {
        useBackendStore.getState().appendLog(items);
      },
    }),
    API.instance.onBackendStatus.subscribe(undefined, {
      onData: status => {
        useBackendStore.setState({ status });
      },
    }),
  ]),
);

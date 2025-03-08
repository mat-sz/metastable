import { UpdateInfo } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { IS_ELECTRON } from '$utils/config';
import { combineUnsubscribables } from '$utils/trpc';

class UpdateStore {
  info: UpdateInfo = {
    canCheckForUpdate: false,
    isAutoUpdateAvailable: false,
  };
  ready = false;
  availableVersion: string | undefined = undefined;

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      linkManager.subscribe(
        combineUnsubscribables(() => [
          API.electron.autoUpdater.onUpdateDownloaded.subscribe(undefined, {
            onData: ({ updateDownloaded, version }) => {
              if (updateDownloaded) {
                runInAction(() => {
                  this.availableVersion = version;
                });
              }
            },
          }),
        ]),
      );
    }
  }

  async refresh() {
    runInAction(() => {
      this.ready = false;
    });
    const data = await API.instance.updateInfo.query();
    runInAction(() => {
      this.info = data;
      this.ready = true;
    });
  }
}

export const updateStore = new UpdateStore();

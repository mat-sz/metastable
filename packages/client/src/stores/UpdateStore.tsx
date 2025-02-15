import { UpdateInfo } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { InstanceUpdateAvailable } from '$modals/instance/updateAvailable';
import { IS_ELECTRON } from '$utils/config';
import { combineUnsubscribables } from '$utils/trpc';
import { modalStore } from './ModalStore';

class UpdateStore {
  info: UpdateInfo = {
    canCheckForUpdate: false,
    isAutoUpdateAvailable: false,
  };
  ready = false;

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      linkManager.subscribe(
        combineUnsubscribables(() => [
          API.electron.autoUpdater.onUpdateDownloaded.subscribe(undefined, {
            onData: ({ updateDownloaded, version }) => {
              if (updateDownloaded) {
                modalStore.show(<InstanceUpdateAvailable version={version!} />);
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
